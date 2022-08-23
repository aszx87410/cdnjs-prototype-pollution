const axios = require('axios')
const fs = require('fs');

const API_HOST = 'https://2qwlvlxzb6-dsn.algolia.net/'
const SEARCH_API_URL = '/1/indexes/libraries/query'
const API_KEY = '2663c73014d2e4d6d1778cc8ad9fd010'
const APP_ID = '2QWLVLXZB6'

const instance = axios.create({
  baseURL: API_HOST,
  headers: {
    'x-algolia-api-key': API_KEY,
    'x-algolia-application-id': APP_ID
  }
})

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function write(content) {
  fs.writeFileSync('./data/libs.json', content)
}

async function main() {
  let chars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')
  let allItems = []
  let existLib = {}
  for(let char of chars) {
    console.log(`fetching ${char}`)
    try {
      await sleep(500)
      const data = await getLibraries(char)
      const hits = data.hits
      console.log('length:', hits.length)

      const filtered = []
      for(let item of hits) {
        if (!existLib[item.name]) {
          filtered.push(item)
        }
        existLib[item.name] = true
      }
      allItems = allItems.concat(filtered)
      console.log('filtered length:', filtered.length)
      console.log('total length:', allItems.length)
      write(JSON.stringify(allItems, null, 2))
    } catch(err) {
      console.log('Error!')
      console.log(err, err.toString())
    }
  }
}

async function getLibraries(keyword) {
  const response = await instance.post(SEARCH_API_URL, {
        params: `query=${keyword}&page=0&hitsPerPage=1000`,
        restrictSearchableAttributes: [
          'name'
        ]
  })
  return response.data
}

main()
