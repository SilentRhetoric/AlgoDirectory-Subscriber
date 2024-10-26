# AlgoDirectory Subscriber

This is a configurable Algorand transaction subscription mechanism to watch the chain for transactions that interact with the AlgoDirectory smart contract and trigger events.

## How It Works

The subscriber reads transactions from the chain and reacts to them. Currently, it is configured to look for application calls to the AlgoDirectory smart contract, parse the ARC-28 events that are emitted, and make a post on Twitter when a new listing is created in the directory. An environment variable controls whether the subscriber runs once or in a continuous loop.

## Development

To run the subscriber script:

- `pnpm install`
- Copy `.env.sample` to `.env` and edit to point to the Algorand node you want
- Use the `.env` variable `RUN_LOOP` to control if the subscriber will continuously in a loop and print events (true) or just run once and catch up in a batch (false).
- `pnpm run dev` to run the script in a development mode that watches files and .env for changes.

## Production Test

- `pnpm run build` to build the script for production.
- `pnpm run start` to run the script in production.

## Production

To set up the subscriber to run in production, perform the following setup steps:

- `pnpm run build` to build the script for production.
- Create a systemd service file that will define a service for the script to be run as a managed process. An example service file is below.
- Set the environment variable `RUN_LOOP=true` to have the subscriber run continuously in a loop and handle transactions in real time.

### Example systemd Service

```service
[Unit]
Description=AlgoDirectory Subscriber
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/algodirectory-subscriber
ExecStart=/usr/bin/node /home/pi/algodirectory-subscriber/di>
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=algodirectory-subscriber

[Install]
WantedBy=multi-user.target
```
