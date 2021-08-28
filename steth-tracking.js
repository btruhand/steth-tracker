const axios = require('axios').default.create({
  baseURL: 'https://api.etherscan.io/',
  params: {
    // this is Lido's stETH contract address: https://etherscan.io/address/0xae7ab96520de3a18e5e111b5eaab095312d7fe84
    contractaddress: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
  }
})

/**
 * Get stETH balance of the day
 *
 * @param {string} trackedAddress
 * @returns {BigInt} stETH balance in ERC20 spec which is 18 decimal digits
 */
async function getCurrentBalance (trackedAddress, apiKey) {
  const { data } = await axios.get('api', {
    params: {
      address: trackedAddress,
      apiKey,
      module: 'account',
      action: 'tokenbalance',
      tag: 'latest'
    }
  })
  if (data.message !== 'OK') {
    throw new Error(
      `EtherScan was not able to retrieve current stETH balance. Response was ${data}`
    )
  }
  return BigInt(data.result)
}

module.exports.getCurrentBalance = getCurrentBalance
