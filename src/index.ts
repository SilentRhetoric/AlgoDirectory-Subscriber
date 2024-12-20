import fs from "fs"
import path from "path"
import { AlgorandSubscriber } from "@algorandfoundation/algokit-subscriber"
import { ClientManager } from "@algorandfoundation/algokit-utils/types/client-manager"
import { TransactionResult } from "@algorandfoundation/algokit-utils/types/indexer"
import { Arc28EventGroup } from "@algorandfoundation/algokit-subscriber/types/arc-28"
import { tweetText } from "./tweet"
import { skeetText } from "./skeet"

if (!fs.existsSync(path.join(__dirname, ".env")) && !process.env.ALGOD_SERVER) {
  console.error("Copy /.env.sample to /.env before starting the application.")
  process.exit(1)
}

const APP_ID = Number(process.env.APP_ID)

const directoryEvents: Arc28EventGroup = {
  groupName: "directory",
  processForAppIds: [APP_ID], // Silent 722603330 Tako 723090110
  events: [
    {
      name: "CreateListingEvent",
      args: [
        {
          name: "listing",
          type: "(uint64,uint64,uint64,byte[13],string)",
        },
      ],
      desc: "Defines an ARC-28 event to be emitted by the createListing method that\ncontains the listing which was created for an NFD segment of directory.algo",
    },
    {
      name: "RefreshListingEvent",
      args: [
        {
          name: "listing",
          type: "(uint64,uint64,uint64,byte[13],string)",
        },
      ],
      desc: "Defines an ARC-28 event to be emitted by the refreshListing method that\ncontains the listing which was refreshed",
    },
    {
      name: "AbandonListingEvent",
      args: [
        {
          name: "listing",
          type: "(uint64,uint64,uint64,byte[13],string)",
        },
      ],
      desc: "Defines an ARC-28 event to be emitted by the abandonListing method that\ncontains the listing which was abandoned",
    },
    {
      name: "RemoveTransferredListingEvent",
      args: [
        {
          name: "listing",
          type: "(uint64,uint64,uint64,byte[13],string)",
        },
      ],
      desc: "Defines an ARC-28 event to be emitted by the removeTransferredListing method that\ncontains the listing which was removed after the NFD was transferred",
    },
    {
      name: "DeleteListingEvent",
      args: [
        {
          name: "listing",
          type: "(uint64,uint64,uint64,byte[13],string)",
        },
      ],
      desc: "Defines an ARC-28 event to be emitted by the deleteListing method that\ncontains the listing which was deleted by an admin for inappropriate content",
    },
  ],
}

async function getSubscriber() {
  const algod = ClientManager.getAlgodClientFromEnvironment()
  // const indexer = ClientManager.getIndexerClientFromEnvironment()
  const subscriber = new AlgorandSubscriber(
    {
      arc28Events: [directoryEvents],
      filters: [
        {
          name: "directoryARC28Events",
          filter: {
            arc28Events: [
              { groupName: "directory", eventName: "CreateListingEvent" },
              // { groupName: "directory", eventName: "RefreshListingEvent" },
              // { groupName: "directory", eventName: "AbandonListingEvent" },
              // { groupName: "directory", eventName: "RemoveTransferredListingEvent" },
              // { groupName: "directory", eventName: "DeleteListingEvent" },
            ],
          },
        },
      ],
      // frequencyInSeconds: 5,
      waitForBlockWhenAtTip: true,
      // maxIndexerRoundsToSync: 10000,
      maxRoundsToSync: 30,
      syncBehaviour: "skip-sync-newest",
      watermarkPersistence: {
        get: getLastWatermark,
        set: saveWatermark,
      },
    },
    algod,
    // indexer,
  )

  subscriber.onBatch("directoryARC28Events", async (txns) => {
    console.log(`Received ${txns.length} transactions`)
    await persistTransactions(txns)
  })

  return subscriber
}

// Basic methods that persist the watermark using the filesystem
async function saveWatermark(watermark: number) {
  fs.writeFileSync(path.join(__dirname, "..", "output", "watermark.txt"), watermark.toString(), {
    encoding: "utf-8",
  })
}
async function getLastWatermark(): Promise<number> {
  if (!fs.existsSync(path.join(__dirname, "..", "output", "watermark.txt"))) return 0
  const existing = fs.readFileSync(path.join(__dirname, "..", "output", "watermark.txt"), "utf-8")
  console.log(`Found existing sync watermark in watermark.txt; syncing from ${existing}`)
  return Number(existing)
}

function convertBigIntsToNumbers(key: string, value: unknown) {
  if (typeof value === "bigint") {
    return Number(value)
  }
  return value
}

// Basic methods that persist transactions using the filesystem
async function getSavedTransactions<T>(fileName: string): Promise<T[]> {
  const existing = fs.existsSync(path.join(__dirname, "..", "output", fileName))
    ? (JSON.parse(fs.readFileSync(path.join(__dirname, "..", "output", fileName), "utf-8")) as T[])
    : []
  return existing
}
async function saveTransactions(transactions: unknown[], fileName: string) {
  fs.writeFileSync(
    path.join(__dirname, "..", "output", fileName),
    JSON.stringify(transactions, convertBigIntsToNumbers, 2),
    {
      encoding: "utf-8",
    },
  )

  console.log(`Saved ${transactions.length} transactions to ${fileName}`)
}

async function persistTransactions(newTxns: TransactionResult[]) {
  const txns = await getSavedTransactions("events.json")
  for (const t of newTxns) {
    txns.push(t)
  }
  await saveTransactions(txns, "events.json")
}

;(async () => {
  const subscriber = await getSubscriber()

  if (process.env.RUN_LOOP === "true") {
    // Restart on error
    const maxRetries = 3
    let retryCount = 0
    subscriber.onError(async (e) => {
      retryCount++
      if (retryCount > maxRetries) {
        console.error(e)
        return
      }
      console.log(`Error occurred, retrying in 2 seconds (${retryCount}/${maxRetries})`)
      await new Promise((r) => setTimeout(r, 2_000))
      subscriber.start()
    })

    subscriber.on("directoryARC28Events", (txn) => {
      // console.log(JSON.stringify(txn, convertBigIntsToNumbers, 2))
      if (txn.arc28Events![0].eventName === "CreateListingEvent") {
        const listing = txn.arc28Events![0].args[0]
        const txID = txn.id
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [timestamp, vouchAmount, nfdAppID, tags, name] = Object.values(listing)

        // Where the Twitter action happens
        tweetText(
          `New listing created: ${name}.\u200bdirectory.algo\n\nCheck it out: https://algodirectory.app/listing/${name} \n\nTxID: ${txID}`,
        )

        // Where the Bluesky action happens
        skeetText(
          `New listing created: ${name}.\u200bdirectory.algo\n\nCheck it out: https://algodirectory.app/listing/${name} \n\nTxID: ${txID} \n#Algorand`,
        )
      }
    })

    subscriber.start()
    ;["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
      process.on(signal, () => {
        console.log(`Received ${signal}; stopping subscriber...`)
        subscriber.stop(signal)
      }),
    )
  } else {
    await subscriber.pollOnce()
  }
})().catch((e) => {
  console.error(e)
})
