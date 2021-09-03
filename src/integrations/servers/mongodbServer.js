/**
 * Created by Vladimir on 27.10.16.
 */
'use strict';

const net = require('net');
const server = net.createServer();
const {MongoWireProtocol} = require('./mongodbWireProtocol');


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

server.on('connection', (socket) => {
  console.log('New connection received');
  let request = new MongoWireProtocol();
  socket.on('data', chunk => {
    if (request.finished) {
      request = new MongoWireProtocol();
    }
    request.parse(chunk);
    if (!request.finished) {
      return;
    }

    console.log(`OP Code: ${request.opCode}, Raw: ${JSON.stringify(request)}`);

    if (request.query) {
      const data = {
        opCode: request.opCodes.OP_REPLY,
        responseTo: request.requestId,
        numberReturned: 1,
        cursorID: new Buffer(8).fill(0),
        startingFrom: 0,
        documents: {
          ok: 0,
          errmsg: `no such cmd: ${Object.keys(request.query)[0]}`,
          code: 59,
          'bad cmd': request.query
        }
      };

      if (request.query.whatsmyuri) {
        data.documents = {you: `${socket.remoteAddress}:${socket.remotePort}`, ok: 1};
      }
      if (request.query.getLog) {
        data.documents = {"totalLinesWritten": 0, "log": [], "ok": 1};
      }
      if (request.query.replSetGetStatus) {
        data.documents = {"ok": 0, "errmsg": "not running with --replSet"};
      }
      if (request.query.isMaster) {
        data.documents = {
          "ismaster": true,
          "maxBsonObjectSize": 16777216,
          "maxMessageSizeBytes": 48000000,
          "maxWriteBatchSize": 1000,
          "localTime": new Date().toISOString(),
          "maxWireVersion": 2,
          "minWireVersion": 0,
          "ok": 1
        };
      }

      if (request.fullCollectionName === 'test.system.namespaces') {
        data.documents = [
          {name: 'test.system.indexes'}
        ];
        data.numberReturned = data.documents.length;
      }

      var response = new MongoWireProtocol(data);
      socket.write(response.buffer);
    }
  });

  socket.on('error', error => {
    console.error(error);
  });
  socket.on('close', () => {
    console.log('Connection closed');
  });
});

server.on('listening', () => {
  process.send('mongodb_ready')
});

server.listen({port: 52001, host: 'localhost'});