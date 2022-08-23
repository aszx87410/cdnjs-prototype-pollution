const axios = require('axios')
const fs = require('fs');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function write(content) {
  fs.writeFileSync('./data/libDetail.json', content)
}

if (!fs.existsSync('./data/libDetail.json')) {
  write('[]')
}

const existMap = {}
let detailItems = JSON.parse(fs.readFileSync('./data/libDetail.json', 'utf8'))
for(let item of detailItems) {  
  existMap[item.name] = true
}

async function getDetail(libName, version) {
  const url = `https://api.cdnjs.com/libraries/${encodeURIComponent(libName)}/${version}`
  try {
    const response = await axios(url)
    return response.data
  } catch(err) {
    console.log(url)
    console.log('failed:', libName, err.message)
    //process.exit(1)
  }
}

async function getLib(libraries, lib) {
  console.log('fetching:', lib.name)
  const detail = await getDetail(lib.name, lib.version)
  if (!detail) return
  detailItems.push(detail)
  write(JSON.stringify(detailItems, null, 2))
  console.log(`progress: ${detailItems.length}/${libraries.length}`)
}

async function getFiles() {
  const libraries = JSON.parse(fs.readFileSync('./data/libs.json', 'utf8'))
  for(let lib of libraries) {
    if (existMap[lib.name]) continue
    await sleep(200)
    getLib(libraries, lib)
  }
}

async function main() {
  getFiles()
}

main()