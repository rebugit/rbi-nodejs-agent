/**
 * Light weight postgres server, it will only handle connections
 */

const net = require('net');

const server = net.createServer();

process.on('message', (data) => {
  const parsedMessage = JSON.parse(data)
  if (parsedMessage.type === 'shutdown') {
    console.log('[REBUGIT]: shutting down...')
    server.close(() => {
      console.log('[REBUGIT]: sever closed')
      process.exit(0)
    })
  }
})

server.listen(52000, 'localhost', () => {
  console.log('[REBUGIT]: Tcp server started')
  process.send('serverReady')
});

let sockets = [];

server.on('connection', function (sock) {
  console.log('[REBUGIT]: connected: ' + sock.remoteAddress + ':' + sock.remotePort);
  sockets.push(sock);

  sock.on('data', function (data) {
    console.log("[REBUGIT] data received, echoing back")
    sock.write(data)
  });

  // Add a 'close' event handler to this instance of socket
  sock.on('close', function (data) {
    let index = sockets.findIndex(function (o) {
      return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
    })
    if (index !== -1) sockets.splice(index, 1);
    console.log('[REBUGIT]: closed: ' + sock.remoteAddress + ' ' + sock.remotePort);
  });
});