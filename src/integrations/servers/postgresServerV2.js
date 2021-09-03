/**
 * Light weight postgres server, it will only handle connections
 */

const RESPONSE_CODES = {
  authenticationOk: 0x52,
  readyForQuery: 0x5a,
}

const net = require('net');

const server = net.createServer();

server.listen(5435, '127.0.0.1', () => {
  console.log('Postgres server started')
});

let sockets = [];

server.on('connection', function (sock) {
  console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
  sockets.push(sock);

  sock.on('data', function (data) {
    const code = getCode(data)
    console.log('DATA: ' + data);
    console.log('CODE: ' + code);

    sock.write(startupMessageOK())
    sock.write(readyForQuery())
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

const startupMessageOK = () => {
  const writer = new Writer()
  writer.addInt32(0)

  return writer.flush(RESPONSE_CODES.authenticationOk)
}

const readyForQuery = () => {
  const writer = new Writer()
  return writer.flush(RESPONSE_CODES.readyForQuery)
}

class Writer {
  constructor(size = 256) {
    this.size = size
    this.buffer = Buffer.allocUnsafe(size)
    this.offset = 5
    this.headerPosition = 0
  }

  ensure(size) {
    const remaining = this.buffer.length - this.offset
    if (remaining < size) {
      const oldBuffer = this.buffer
      // exponential growth factor of around ~ 1.5
      // https://stackoverflow.com/questions/2269063/buffer-growth-strategy
      const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size
      this.buffer = Buffer.allocUnsafe(newSize)
      oldBuffer.copy(this.buffer)
    }
  }

  addInt32(num) {
    this.ensure(4)
    this.buffer[this.offset++] = (num >>> 24) & 0xff
    this.buffer[this.offset++] = (num >>> 16) & 0xff
    this.buffer[this.offset++] = (num >>> 8) & 0xff
    this.buffer[this.offset++] = (num >>> 0) & 0xff
    return this
  }

  join(code) {
    if (code) {
      this.buffer[this.headerPosition] = code
      //length is everything in this packet minus the code
      const length = this.offset - (this.headerPosition + 1)
      this.buffer.writeInt32BE(length, this.headerPosition + 1)
    }
    return this.buffer.slice(code ? 0 : 5, this.offset)
  }

  flush(code) {
    const result = this.join(code)
    this.offset = 5
    this.headerPosition = 0
    this.buffer = Buffer.allocUnsafe(this.size)
    return result
  }
}