import AtpAgent from "@atproto/api"

// Create a Bluesky Agent
const agent = new AtpAgent({
  service: "https://bsky.social",
})

export async function skeetText(text: string) {
  try {
    await agent.login({
      identifier: process.env.BLUESKY_USERNAME!,
      password: process.env.BLUESKY_PASSWORD!,
    })
    agent.post({
      text,
    })
    // console.log(`Successfully skeeted:\n${text}`)
  } catch (error) {
    console.log(error)
  }
}
