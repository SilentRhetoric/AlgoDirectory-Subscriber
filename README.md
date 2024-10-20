# AlgoDirectory Subscriber

This is a configurable Algorand transaction subscription mechanism to watch the chain for transactions that interact with the AlgoDirectory smart contract and trigger events.

## Development

To run the subscriber script:

- `pnpm install`
- Copy `.env.sample` to `.env` and edit to point to the Algorand node you want
- Use the `.env` variable `RUN_LOOP` to control if the subscriber will continuously in a loop and print events (true) or just run once and catch up in a batch (false).
- `pnpm run dev` to run the script in a development mode that watches files and .env for changes.
- `pnpm run start` to run the script in production.
