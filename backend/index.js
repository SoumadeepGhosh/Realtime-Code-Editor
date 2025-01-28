import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path"

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

const rooms = new Map();

io.on ("connection", (socket) => {
    console.log("Client Connected", socket.id)

    let currenRoom = null;
    let currentUser = null; 

    socket.on("join", ({roomId, userName}) => {
        if (currenRoom) {
            socket.leave(currenRoom);
            rooms.get(currenRoom).delete(currentUser);
            io.to(currenRoom).emit("userJoined", Array.from(rooms.get(currenRoom)));
        }

        currenRoom = roomId;
        currentUser = userName;

        socket.join(roomId)

        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }

        rooms.get(roomId).add(userName);

        io.to(roomId).emit("userJoined", Array.from(rooms.get(currenRoom)));
        
    });

    socket.on("codeChange", ({roomId, code}) => {
        socket.to(roomId).emit("codeUpdate", code);
    })

    socket.on("leaveRoom", () => {
        if (currenRoom && currentUser) {
            rooms.get(currenRoom).delete(currentUser);
            io.to(currenRoom).emit("userJoined", Array.from(rooms.get(currenRoom)));

            socket.leave(currenRoom)
            currenRoom = null;
            currentUser = null;
        }
    });

    socket.on("typing", ({roomId, userName}) => {
        socket.to(roomId).emit("userTyping",userName)
    })

    socket.on("languageChange", ({roomId, language}) => {
        io.to(roomId).emit("languageUpdate", language)
    })

    socket.on("disconnect", () => {
        if (currenRoom && currentUser) {
            rooms.get(currenRoom).delete(currentUser);
            io.to(currenRoom).emit("userJoined", Array.from(rooms.get(currenRoom)));
        }
        console.log("User Disconnected")
    })
});
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve()

app.use(express.static(path.join(__dirname, "/frontend/dist")))

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend ", "dist", "index.html"))
})


server.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});