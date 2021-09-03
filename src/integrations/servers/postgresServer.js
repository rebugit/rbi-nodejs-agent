/**
 * Experimental feature to simulate a light-weight postgres server,
 * this will return the data and handle of the communication.
 * This can be very complex
 */

const net = require('net');

const RESPONSE_CODES = {
  authenticationOk: 0x52,
  readyForQuery: 0x5a,
  idle: 0x49,
  parseOk: 0x31,
  bindOk: 0x32,
  copy: 0x64,
  copyDone: 0x63,
  rowDescription: 0x54,
  dataRow: 0x44,
  commandComplete: 0x43,
  copyInResponse: 0x47
}

const REQUEST_CODES = {
  parse: 'P',
  bind: 'B',
  describe: 'D',
  copy: 'H',
  execute: 'E',
  sync: 'S',
  copyFail: 'f'
}

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

    switch (code){
      case REQUEST_CODES.parse:
      case REQUEST_CODES.bind:
      case REQUEST_CODES.describe:
        break
      case REQUEST_CODES.execute:
        sock.write(rowDescription())
        sock.write(dataRow())
        sock.write(getCommandComplete())
        sock.write(readyForQuery())
        break
      case REQUEST_CODES.sync:
        sock.write(getCommandComplete())
        sock.write(readyForQuery())
        break
      default:
        sock.write(startupMessageOK())
        sock.write(readyForQuery())
        break
    }
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

const getCommandComplete = () => {
  const writer = new Writer()
  writer.addString('SELECT 1')
  return writer.flush(RESPONSE_CODES.commandComplete)
}

function rowDescription() {
  const writer = new Writer()
  writer.addInt16(1)
  writer.addCString('id')
  writer.addInt32(123)
  writer.addInt16(1)
  writer.addInt32(1043)
  writer.addInt16(3)
  writer.addInt32(3)
  writer.addInt16(0)
  return writer.flush(RESPONSE_CODES.rowDescription)
}

function dataRow() {
  const value = 'hello'
  const writer = new Writer()
  writer.addInt16(1)
  writer.addInt32(value.length)
  writer.addString(value)

  return writer.flush(RESPONSE_CODES.dataRow)
}

function parseOk() {
  const writer = new Writer()
  return writer.flush(RESPONSE_CODES.parseOk)
}

function bindOK() {
  const writer = new Writer()
  return writer.flush(RESPONSE_CODES.parseOk)
}

function getCopyInResponse() {
  const writer = new Writer()
  writer.addInt8(0)
  writer.addInt16(1)
  writer.addInt16(0)
  return writer.flush(RESPONSE_CODES.copyInResponse)
}

function copyDone(){
  const writer = new Writer()
  return writer.flush(RESPONSE_CODES.copyDone)
}

const getCode = (buff) => {
  const b = buff.slice(0, 1)
  return b.toString()
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

  addInt16(num) {
    this.ensure(2)
    this.buffer[this.offset++] = (num >>> 8) & 0xff
    this.buffer[this.offset++] = (num >>> 0) & 0xff
    return this
  }

  addInt8(num) {
    this.ensure(1)
    this.buffer[this.offset++] = (num >>> 0) & 0xff
    return this
  }

  addCString(string) {
    if (!string) {
      this.ensure(1)
    } else {
      const len = Buffer.byteLength(string)
      this.ensure(len + 1) // +1 for null terminator
      this.buffer.write(string, this.offset, 'utf-8')
      this.offset += len
    }

    this.buffer[this.offset++] = 0 // null terminator
    return this
  }

  addString(string = '') {
    const len = Buffer.byteLength(string)
    this.ensure(len)
    this.buffer.write(string, this.offset)
    this.offset += len
    return this
  }

  add(otherBuffer) {
    this.ensure(otherBuffer.length)
    otherBuffer.copy(this.buffer, this.offset)
    this.offset += otherBuffer.length
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