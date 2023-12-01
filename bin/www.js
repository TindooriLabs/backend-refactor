#!/usr/bin/env node

/**
 * Module dependencies.
 */
import "dotenv/config";
import app from "../app.js";
import debug from "debug";
import http from "http";
import buildDeps from "../config/deps.js";
import { Server } from "socket.io";
import { socketLog, socketJwtAuth } from "../socket/middleware.js";
import { server as WebSocketServer } from "websocket";
import { getStatusByReason } from "../controllers/controller-helper.js";

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

let wsServer = new WebSocketServer({
  httpServer: server,
});

let clients = new Map();

function originIsAllowed(request) {
  // put logic here to detect whether the specified origin is allowed.
  const token = request.resourceURL.query.token;
  const verificationResult = socketJwtAuth(token);
  return verificationResult;
}

wsServer.on("request", function (request) {
  let verificationResult = originIsAllowed(request);
  if (!verificationResult.ok) {
    // Make sure we only accept requests from an allowed origin
    request.reject(
      getStatusByReason(verificationResult.reason),
      verificationResult.message
    );
    console.log(
      new Date() + " Connection from origin " + request.origin + " rejected."
    );
    return;
  }

  var connection = request.accept(null, request.origin);

  console.log(new Date() + " Connection accepted.");
  const chatId = request.resourceURL.query.chatId;
  clients.set(connection, { chatId, userId: verificationResult.userId });

  connection.on("message", function (message) {
    broadcast(message.utf8Data, connection);
  });

  connection.on("close", function (reasonCode, description) {
    clients.delete(connection);
    console.log(
      new Date() + " Peer " + connection.remoteAddress + " disconnected."
    );
  });
});

function broadcast(message, sender) {
  // Broadcast the message to all clients in the same room
  clients.forEach((client, connection) => {
    if (client.chatId === clients.get(sender).chatId) {
      connection.send(message);
    }
  });
}

//Socket integration
// const io = new Server(server, {
//   allowEIO3: true,
// });
// io.use(socketLog);

//Socket auth: https://socket.io/docs/v4/middlewares/#sending-credentials
// io.use(socketJwtAuth);
// app.set("io", io);

// io.on("connection", () => {
//   console.log("User connected");
// });

// io.on("joinRoom", (socket, conversationId) => {
//   socket.join(conversationId);
//   console.log(`User joined room ${conversationId}`);
// });

// io.on("message", (data) => {
//   io.in(data.id).emit("message", data.message);
//   console.log("Message => " + data);
// });

// io.on("disconnect", () => {
//   console.log("User disconnected.");
// });

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
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
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
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}
