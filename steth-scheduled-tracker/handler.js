'use strict'

const axios = require('axios').default.create({
  baseURL: 'https://api.etherscan.io/',
  params: {
    address: process.env.ETH_ADDRESS,
    apiKey: process.env.ETHERSCAN_API_KEY,
    // this is Lido's stETH contract address: https://etherscan.io/address/0xae7ab96520de3a18e5e111b5eaab095312d7fe84
    contractaddress: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
  }
})

module.exports.run = async (event, context) => {
  const time = new Date()
  console.log(
    `"${context.functionName}"  running at ${time} with event ${JSON.stringify(
      event
    )} and context ${JSON.stringify(context)}`
  )
  const { data } = await axios.get('api', {
    params: {
      module: 'account',
      action: 'tokenbalance',
      tag: 'latest'
    }
  })
  console.log('data response from EtherScan', data)
}
