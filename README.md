# AlgoDirectory Subscriber

This is a configurable Algorand transaction subscription mechanism to watch the chain for transactions that interact with the AlgoDirectory smart contract and trigger events.

To learn more about AlgoDirectory, how it works, and its history, visit <https://algodirectory.app/about>.

This work has been performed with support from the Algorand Foundation xGov Grants Program.

## How It Works

The subscriber reads transactions from the chain and reacts to them. Currently, it is configured to look for application calls to the AlgoDirectory smart contract, parse the ARC-28 events that are emitted, and make a post on Twitter when a new listing is created in the directory. An environment variable controls whether the subscriber runs once or in a continuous loop.

## Development

To run the subscriber script:

- `pnpm install`
- Copy `.env.sample` to `.env` and edit to point to the Algorand node you want
- Use the `.env` variable `RUN_LOOP` to control if the subscriber will continuously in a loop and print events (true) or just run once and catch up in a batch (false).
- `pnpm run dev` to run the script in a development mode that watches files and .env for changes.

## Production

To set up the subscriber to run continuously as a managed service, create a systemd service file that will define a service for the script to be run as a managed process. An example service file is below.

### Example systemd Service

```service
[Unit]
Description=AlgoDirectory Subscriber
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/AlgoDirectory-Subscriber
Environment=PATH=/home/pi/.nvm/versions/node/v23.1.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=NODE_PATH=/home/pi/.nvm/versions/node/v23.1.0/bin/node
ExecStart=/home/pi/.nvm/versions/node/v23.1.0/bin/pnpm run start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=algodirectory-subscriber

[Install]
WantedBy=multi-user.target
```

## Contributing

The AlgoDirectory project consists of three repositories:

1. [AlgoDirectory](https://github.com/SilentRhetoric/AlgoDirectory): The web interface for interacting with the Directory
2. [AlgoDirectory-Contract](https://github.com/SilentRhetoric/AlgoDirectory-Contract): The smart contract and associated deployment and testing scripts
3. [AlgoDirectory-Subscriber](https://github.com/SilentRhetoric/AlgoDirectory-Subscriber): This subsriber process that watches the chain for transactions to post on Twitter

We welcome pull requests from community contributors, although we recommend reaching out to us first given the complexity of the project.
