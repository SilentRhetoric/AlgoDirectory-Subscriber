import AtpAgent, { RichText } from "@atproto/api"

// Create a Bluesky Agent
const agent = new AtpAgent({
  service: "https://bsky.social",
})

export async function skeetText(text: string) {
  const rt = new RichText({
    text,
  })
  await rt.detectFacets(agent)
  const postRecord = {
    $type: "app.bsky.feed.post",
    text: rt.text,
    facets: rt.facets,
  }
  try {
    await agent.login({
      identifier: process.env.BLUESKY_USERNAME!,
      password: process.env.BLUESKY_PASSWORD!,
    })
    agent.post(postRecord)
    // console.log(`Successfully skeeted:\n${text}`)
  } catch (error) {
    console.log(error)
  }
}
