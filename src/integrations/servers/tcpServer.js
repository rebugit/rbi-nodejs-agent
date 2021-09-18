/**
 * Light weight postgres server, it will only handle connections
 */

const net = require('net');

const server = net.createServer();

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

server.listen(52000, '127.0.0.1', () => {
  console.log('Tcp server started')
  process.send('serverReady')
});

let sockets = [];

server.on('connection', function (sock) {
  console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
  sockets.push(sock);

  sock.on('data', function (data) {
    sock.write(data)
  });

  // Add a 'close' event handler to this instance of socket
  sock.on('close', function (data) {
    let index = sockets.findIndex(function (o) {
      return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
    })
    if (index !== -1) sockets.splice(index, 1);
    console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
  });
});