import { TwitterApi } from "twitter-api-v2"

// Fill your API credentials
const client = new TwitterApi({
  appKey: process.env.API_KEY!,
  appSecret: process.env.API_SECRET_KEY!,
  accessToken: process.env.ACCESS_TOKEN!,
  accessSecret: process.env.ACCESS_TOKEN_SECRET!,
  // bearerToken: process.env.BEARER_TOKEN!
})

// Provide read write controls
const rwClient = client.readWrite

// Create textTweet function which posts a text only tweet
export const tweetText = async () => {
  try {
    await rwClient.v2.tweet("Test, please ignore")
    console.log("Success")
  } catch (error) {
    console.log(error)
  }
}

tweetText()
