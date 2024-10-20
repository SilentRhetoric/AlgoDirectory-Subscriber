import fs from "fs"
import path from "path"
import { TransactionType } from "algosdk"
import { AlgorandSubscriber } from "@algorandfoundation/algokit-subscriber"
import { ClientManager } from "@algorandfoundation/algokit-utils/types/client-manager"
import { TransactionResult } from "@algorandfoundation/algokit-utils/types/indexer"

if (!fs.existsSync(path.join(__dirname, ".env")) && !process.env.ALGOD_SERVER) {
  console.error("Copy /.env.sample to /.env before starting the application.")
  process.exit(1)
}

function convertBigIntsToNumbers(key: string, value: unknown) {
  if (typeof value === "bigint") {
    return Number(value)
  }
  return value
}

async function getSubscriber() {
  const algod = ClientManager.getAlgodClientFromEnvironment()
  const indexer = ClientManager.getIndexerClientFromEnvironment()
  const subscriber = new AlgorandSubscriber(
    {
      filters: [
        // {
        //   name: "usdc",
        //   filter: {
        //     type: TransactionType.axfer,
        //     assetId: 31566704, // MainNet: USDC
        //     minAmount: 1_000_000, // $1
        //   },
        // },
        {
          name: "directory",
          filter: {
            type: TransactionType.appl,
            appId: 722603330n,
          },
        },
      ],
      frequencyInSeconds: 10,
      waitForBlockWhenAtTip: true,
      maxIndexerRoundsToSync: 1000,
      maxRoundsToSync: 1000,
      syncBehaviour: "skip-sync-newest",
      watermarkPersistence: {
        get: getLastWatermark,
        set: saveWatermark,
      },
    },
    algod,
    indexer,
  )

  // subscriber.onBatch("usdc", async (events) => {
  //   console.log(`Received ${events.length} asset changes`)
  //   // Save all of the events
  //   await persistTransactions(events)
  // })
  subscriber.onBatch("directory", async (txns) => {
    console.log(`Received ${txns.length} transactions`)
    // Save all of the events
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

    // If running in a loop, listen for events and do something immediately
    // subscriber.on("usdc", (transfer) => {
    //   console.log(
    //     `${transfer.sender} sent ${transfer["asset-transfer-transaction"]?.receiver} USDC$${Number(
    //       BigInt(transfer["asset-transfer-transaction"]?.amount ?? 0) / 1_000_000n,
    //     ).toFixed(2)} in transaction ${transfer.id}`,
    //   )
    // })

    subscriber.on("directory", (txn) => {
      console.log(JSON.stringify(txn, convertBigIntsToNumbers, 2))
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
