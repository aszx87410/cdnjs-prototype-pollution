const express = require('express')
const fs = require('fs')
const puppeteer = require('puppeteer');

const app = express()
const port = 5566
const baseUrl = `http://localhost:${port}/load`

if (!fs.existsSync('./data/pollutes.json')) {
  saveResult({})
}

const details = JSON.parse(fs.readFileSync('./data/libDetail.json'), 'utf8')
const result = JSON.parse(fs.readFileSync('./data/pollutes.json'), 'utf8')
let fileList = []
let mode = 'library'

function getHtml(items) {
  const scripts = items
    .map(item => `<script src="https://cdnjs.cloudflare.com/ajax/libs/${item}"></script>`)
    .join('\n')
  return `
<!DOCTYPE html>

<html lang="en">
<head>
  <meta charset="utf-8">
  <script>
    function getPrototypeFunctions(prototype) {
      return Object.getOwnPropertyNames(prototype)
    }
    var protos = {
      array: getPrototypeFunctions(Array.prototype),
      string: getPrototypeFunctions(String.prototype),
      number: getPrototypeFunctions(Number.prototype),
      object: getPrototypeFunctions(Object.prototype),
      function: getPrototypeFunctions(Function.prototype)
    }
  </script>
</head>
<body>
  <!-- insert here -->
  ${scripts}
  <!-- insert here -->
  <script>

    var newProtos = {
      array: getPrototypeFunctions(Array.prototype),
      string: getPrototypeFunctions(String.prototype),
      number: getPrototypeFunctions(Number.prototype),
      object: getPrototypeFunctions(Object.prototype),
      function: getPrototypeFunctions(Function.prototype)
    }

    let result = {
      prototypeFunctions: [],
      functionsReturnWindow: []
    }

    function check() {
      checkPrototype('array', 'Array.prototype', Array.prototype)
      checkPrototype('string', 'String.prototype', String.prototype)
      checkPrototype('number', 'Number.prototype', Number.prototype)
      checkPrototype('object', 'Object.prototype', Object.prototype)
      checkPrototype('function', 'Function.prototype', Function.prototype)

      return result
    }

    function checkPrototype(name, prototypeName, prototype) {
      const oldFuncs = protos[name]
      const newFuncs = newProtos[name]
      for(let fnName of newFuncs) {
        if (!oldFuncs.includes(fnName)) {
          const fullName = prototypeName + '.' + fnName
          result.prototypeFunctions.push(fullName)
          try {
            if (prototype[fnName].call() === window) {
              result.functionsReturnWindow.push(fullName)
            }
          } catch(err) {

          }
        }
      }
    }
  </script>
</body>
</html>
  `
}

app.get('/load', (req, res) => {
  const start = Number(req.query.start)
  const end = Number(req.query.end)
  let files = []
  if (mode === 'library') {
    const items = details.slice(start, end + 1)
    files = items.flatMap(item => 
      (item.files || []).map(file => `${item.name}/${item.version}/${file}`)
        ).filter(item => item.endsWith('.js'))
  } else {
    files = fileList.slice(start, end + 1)
  }
  
  res.setHeader('content-type', 'text/html')
  res.send(getHtml(files)) 
})

app.listen(port, () => {
  run()
  console.log(`Scanning app listening on port ${port}, http://localhost:${port}`)
})

function saveResult(input) {
  fs.writeFileSync('./data/pollutes.json', JSON.stringify(input, null, 2))
}

function saveFileResult(input) {
  fs.writeFileSync('./data/pollutesForWindow.json', JSON.stringify(input, null, 2))
}

async function run() {
  console.log('running scan')
  console.log('start from:', result.progress)
  console.log('total:', details.length)
  const step = 10

  // find files from matched libraries
  if (result.progress >= details.length) {
    console.log('scan for files')
    await findPollueFiles()
    console.log('done, all files found')
    process.exit(0)
  }
  
  // find libraries
  for(let i = (result.progress || 0); i<details.length; i+=step) {
    try {
      await find(i, i + step - 1)
    } catch(err) {
      console.log(err)
    }
    result.progress = i + step
    saveResult(result)
  }
  console.log('done, all libraries found, please run again to scan files')
  process.exit(0)
}

async function visit(start, end) {
  const url = `${baseUrl}?start=${start}&end=${end}`
  console.log('visit:', url)
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  })
  const page = await browser.newPage()
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 20*1000
  })

  const checkResult = await page.evaluate(() => {
    return check()
  });

  await browser.close()
  return checkResult
}

async function find(start, end) {
  const checkResult = await visit(start, end)
  if (checkResult.prototypeFunctions.length === 0) {
    return
  }

  // found
  if (start === end) {
    console.log('found:', details[start].name)
    if (!result.items) {
      result.items = []
    }
    result.items.push({
      name: details[start].name,
      version: details[start].version,
      result: checkResult
    })
    return
  }

  const M = Math.floor((start + end) / 2)
  await find(start, M)
  await find(M+1, end)
}

async function findPollueFiles() {
  const libraries = result.items.filter(item => item.result.functionsReturnWindow.length > 0)
  const files = libraries.flatMap(lib => {
    const libDetail = details.find(item => item.name === lib.name)
    if (!libDetail) return []
    return (libDetail.files || []).map(file => `${libDetail.name}/${libDetail.version}/${file}`)
      .filter(item => item.endsWith('.js'))
  })
  fileList = files
  mode = 'file'

  let fileResult = []
  console.log('length:', fileList.length)
  for(let i=0; i<fileList.length; i++) {
    try {
      const checkResult = await visit(i, i)
      if (checkResult.functionsReturnWindow.length === 0) {
        continue
      }

      fileResult.push({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/' + fileList[i],
        functions: checkResult.functionsReturnWindow
      })
      saveFileResult(fileResult)
    } catch(err) {
      console.log(err)
    }
  }
}
