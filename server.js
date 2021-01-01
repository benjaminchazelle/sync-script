const {documentUrl, serverPort} = require("./env");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const axios = require("axios");
const io = require("socket.io")(http, {
    cors: {
        origin: "*"
    }
});

app.use(express.static("public"));

let sockets = [];

function broadcast(eventName, eventPayload = undefined, ack = () => {
}) {
    for (let socket of sockets) {
        socket.emit(eventName, eventPayload, ack);
    }
}

let script = "";
let sync = -1;

async function updateScript() {
    const document = await axios.get(documentUrl);
    script = document.data.match(/<style(.*)<\/style>/gm)[0] + document.data.match(/<table(.*)<\/table>/gm)[0];
    broadcast("updateScript", script);
}

updateScript();
setInterval(updateScript, 5*60*1000);

io.on("connection", socket => {
    sockets.push(socket);

    socket.on("sync", payload => {
        sync = payload;
        broadcast("sync", sync);
    });

    socket.emit("updateScript", script);

    socket.emit("sync", sync);
});

http.listen(serverPort, () => {
    console.log(`Server port : ${serverPort}`);
});

