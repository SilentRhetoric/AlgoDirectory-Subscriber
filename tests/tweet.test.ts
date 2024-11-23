import { tweetText } from "../src/tweet"
;(async () => {
  const result = await tweetText(`Test, please ignore\n\nhttps://algodirectory.app`)
  console.log("Tweet result: ", result)
})()
