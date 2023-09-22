#!/usr/bin/env node

/**
 * Module dependencies.
 */
import 'dotenv/config';
import app from "../app.js";
import debug from "debug";
import http from "http";
import buildDeps from "../config/deps.js";
import socketIo from "socket.io";
import { socketLog, socketJwtAuth } from "../socket/middleware.js";
import {
  connect as ioConnect,
  disconnect as ioDisconnect
} from "../socket/connection.js";

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

//Socket integration
const io = socketIo(server);
io.use(socketLog);

//Socket auth: https://socket.io/docs/v4/middlewares/#sending-credentials
io.use(socketJwtAuth);
app.set("io", io);

io.on("connection", socket => {
  ioConnect(socket);
  socket.on("disconnect", ioDisconnect);
});

buildDeps(app).then(() => {
  server.listen(port);
  server.on("error", onError);
  server.on("listening", onListening);

  console.log(`Listening on port ${port}...`);
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
