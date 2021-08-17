const { getCurrentBalance } = require('./steth-tracking');
const { cleanEnv, str, makeValidator } = require('envalid');
const fs = require('fs');
const { serializeError } = require('serialize-error');

const file = makeValidator((filePath) => {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (err) {
    throw new Error(`supplied file ${filePath} is not readable`);
  }
  return filePath;
});

function getValidatedEnvironment() {
  return cleanEnv(process.env, {
    ETH_ADDRESS: str({ desc: 'Ethereum address that holds stETH to be tracked' }),
    ETHERSCAN_API_KEY: str({ desc: 'EtherScan API Key' }),
    BALANCE_FILE: file({ desc: 'File path that should contain the balance file' }),
    REBASING_TRACKING_FILE: file({ desc: 'File path that contains rebasing information' })
  });
}

function readBalanceFromFile(balanceFile) {
  const balance = fs.readFileSync(balanceFile).toString();
  return BigInt(balance.trim());
}

// see: https://docs.openzeppelin.com/contracts/3.x/erc20#a-note-on-decimals
const ERC20_TOKEN_PRECISION = 18;

/**
 * @param {BigInt} value
 */
function formatErc20TokenValue(value) {
  let stringifiedValue = value.toString();
  if (stringifiedValue.length <= ERC20_TOKEN_PRECISION) {
    return `0.${stringifiedValue.padStart(ERC20_TOKEN_PRECISION, '0')}`;
  }
  stringifiedValue.slice(0, stringifiedValue.length - ERC20_TOKEN_PRECISION)
    + '.' + stringifiedValue.slice(ERC20_TOKEN_PRECISION);
}

/**
 * @param {BigInt} rebaseAmount
 * @param {string} rebaseFile
 */
function addRebaseToFile(rebaseAmount, rebaseFile) {
  const rebaseToAppend = JSON.stringify(
    { rebase_amount: formatErc20TokenValue(rebaseAmount), processing_time: new Date() }
  );
  fs.appendFileSync(
    rebaseFile,
    `\n${rebaseToAppend}`
  );
}

function updateBalanceFile(balanceFile, newBalance) {
  fs.writeFileSync(balanceFile, `${newBalance}\n`);
}

async function main() {
  const env = getValidatedEnvironment();
  const currentBalance = await getCurrentBalance(env.ETH_ADDRESS, env.ETHERSCAN_API_KEY);
  const previousBalance = readBalanceFromFile(env.BALANCE_FILE);
  const rebaseAmount = currentBalance - previousBalance;
  updateBalanceFile(env.BALANCE_FILE, currentBalance);
  addRebaseToFile(rebaseAmount, env.REBASING_TRACKING_FILE);
}

main().catch(err => {
  console.log(`An error happened when running cron tracker: ${JSON.stringify(serializeError(err))}`);
});
