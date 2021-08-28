# stETH Tracker

This is a simple utility function that I made to easily track rebase amounts on the [stETH](https://lido.fi/) ERC20 token

`stETH` is an ERC20 token that performs rebasing. In essence if you are a holder of `stETH` everyday the amount of `stETH` you are holding will gradually increase (I haven't seen a decreasing event). There are no transactions recorded in the block chain so transaction tracking tools out there cannot take into account these rebasing events.

So this tool was made to track those events (ideally run daily). `stETH` rebases every day at [12 PM UTC](https://blog.lido.fi/lido-development-update-one-month-of-lido/). So you'd want to run this small utility tool after then (adjust according to your time)

# Running the utility

This utility uses [EtherScan's API](https://docs.etherscan.io/) so you would need to create an API account first

## Environment variables

Before running the program, make sure that you have the following environment variables setup, or else you will run to an error as shown below

```bash
================================
 Missing environment variables:
    BALANCE_FILE: File path that should contain the balance file
    EMAIL_ADDRESS: email address to send results to
    ETHERSCAN_API_KEY: EtherScan API Key
    ETH_ADDRESS: Ethereum address that holds stETH to be tracked
    REBASING_TRACKING_FILE: File path that contains rebasing information

 Exiting with error code 1
================================
```

## Manually run

To run manually, simply run:

```bash
node cron-tracker.js
```

Two files `rebase-file` and `balance-file` will be generated if it is your first time running it:

- `balance-file` contains the `stETH` balance that you have at the time of the command invocation
- `rebalance-file` is an append-only tracking file of the rebasing value everyday based on the current balane and the balance recorded in `balance-file`

At the first time of invocation, your `rebalance-file` will be empty and the `balance-file` will contain your current balance. Future invocations will update these two files accordingly

## Emails

An email will be sent to to the address specified in the `EMAIL_ADDRESS` env variable. The utility tool uses [mail *nix command](https://www.commandlinux.com/man-page/man1/Mail.1.html), so make sure your machine can send mails through some [Mail Transfer Agent](https://developer.ibm.com/tutorials/l-lpic1-108-3/). The subject of the email will be either `[SUCCESS] stETH rebase calculation result` or `[FAILURE] stETH rebase calculation result`.

The emails may be marked as spam by your email client, make sure to check your spam folder

# OS platforms tested

This program has only been tested on:

- `MacOS BigSur v11+`
