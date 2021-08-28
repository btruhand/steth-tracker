const { getCurrentBalance } = require('./steth-tracking');
const { cleanEnv, str, makeValidator } = require('envalid');
const fs = require('fs');
const { serializeError } = require('serialize-error');
const { execSync } = require('child_process');

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
    REBASING_TRACKING_FILE: file({ desc: 'File path that contains rebasing information' }),
    EMAIL_ADDRESS: str({ desc: 'email address to send results to' })
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
    `${rebaseToAppend}\n`
  );
}

function updateBalanceFile(balanceFile, newBalance) {
  fs.writeFileSync(balanceFile, `${newBalance}\n`);
}

/**
 * @param {{
 *  total_balance?: String,
 *  rebase_amount?: String,
 *  error?: String 
 * }} results
 * @param {string} subject 
 * @param {to} subject
 */
function mail(results, subject, to) {
  const mailContent = `
    Total balance: ${results.total_balance !== undefined ? results.total_balance : 'N/A'}
    Rebased amount: ${results.rebase_amount != undefined ? results.rebase_amount : 'N/A'}
    Date: ${new Date()}
    Error: ${results.error ? results.error : 'N/A'}
  `;
  execSync(`echo "${mailContent}" | mail -s "${subject}" ${to}`);
}

const env = getValidatedEnvironment();

/**
 * @returns {Promise<{
 *  total_balance: String
 *  rebase_amount: String
 * }>}
 */
async function main() {
  const currentBalance = await getCurrentBalance(env.ETH_ADDRESS, env.ETHERSCAN_API_KEY);
  const previousBalance = readBalanceFromFile(env.BALANCE_FILE);
  /**
   * @type {BigInt}
   */
  const rebaseAmount = currentBalance - previousBalance;
  updateBalanceFile(env.BALANCE_FILE, currentBalance);
  addRebaseToFile(rebaseAmount, env.REBASING_TRACKING_FILE);
  return { total_balance: formatErc20TokenValue(currentBalance), rebase_amount: formatErc20TokenValue(rebaseAmount) }
}

const EMAIL_SUBJECT = 'stETH rebase calculation result';

main()
  .then(results => mail(results, `[SUCCESS] ${EMAIL_SUBJECT}`, env.EMAIL_ADDRESS))
  .catch(err => mail({ error: serializeError(err) }, `[FAILURE] ${EMAIL_SUBJECT}`, env.EMAIL_ADDRESS));
