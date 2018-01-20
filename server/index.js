const path = require("path");
const config = require("config");
const express = require("express");
const socketio = require("socket.io");

const clientEventHandler = require(path.join(config.get("paths.basePath"), "adapter/clientEventHandler"));

let port = 3000;
let count = 0;

let app = express();
let server = require("http").createServer(app);
let io = socketio(server);

app.get("/", (req, res) => { res.send("response"); });

io.on("connect", (socket) => {
    socket.emit("message", { hello: "world" });
    console.log("new connection");
    clientEventHandler.registerHandler(socket);
});

server.listen(port, () => {
    console.log(`server listening on ${port}`);
});