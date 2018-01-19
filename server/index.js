const express = require("express");
const socketio = require("socket.io");

let port = 3000;
let count = 0;

let app = express();
let server = require("http").createServer(app);
let io = socketio(server);

app.get("/", (req, res) => { res.send("response"); });

io.on("connect", (socket) => {
    socket.emit("message", { hello: "world" });

    socket.on("signup", (payload) => {
        count++;
        console.log(`sign on, name: ${payload.name}, count: ${count}`);
        socket.emit("countUpdate", { count: count });
        socket.broadcast.emit("countUpdate", { count: count });
    });

    socket.on("signoff", (payload) => {
        count--;
        console.log(`sign off, name: ${payload.name}, count: ${count}`);
        socket.emit("countUpdate", { count: count });
        socket.broadcast.emit("countUpdate", { count: count });
    });
});

server.listen(port, () => { console.log(`server listening on ${port}`); });