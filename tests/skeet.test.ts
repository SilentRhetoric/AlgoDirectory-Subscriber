import { skeetText } from "../src/skeet"
;(async () => {
  const result = await skeetText(`Test, please ignore\n\nhttps://algodirectory.app`)
  console.log("Skeet result: ", result)
})()
