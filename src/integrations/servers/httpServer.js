const http = require('http');

let response = ""

process.on('message', (data) => {
  const parsedMessage = JSON.parse(data)
  if (parsedMessage.type === 'data') {
    // Since we are in another thread, in debug mode this will interfere
    // with the debugging session, therefore we close the inspector
    require('inspector').close()
    console.log('data received')
    response = parsedMessage.data
  }

  if (parsedMessage.type === 'shutdown') {
    console.log('shutting down...')
    server.close(() => {
      console.log('sever closed')
      process.exit(0)
    })
  }
})

const composeResponse = (res, response) => {
  res.writeHead(200, response.headers);
  res.end(response.body);
}

const requestListener = function (req, res) {
  composeResponse(res, response)
}

const server = http.createServer(requestListener);
server.listen(52000, () => {
  process.send('serverReady')
});