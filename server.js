const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { addUser, getUsersInRoom, removeUser } = require("./users");

const SECRET_KEY = process.env.SECRET_KEY || "iamthere";
const homeDir = path.join(__dirname, "client", "build");

console.log(homeDir);
app.use(cors());
app.use(express.static(homeDir));

const port = process.env.PORT || 10000;
const server = http.createServer(app);//intializing server

const io = new Server(server, {
  cors: {
    origin: "https://secure-chat-messenger.onrender.com",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data, cb) => {
    const user = addUser(socket.id, data.username, data.roomname);

    if (user.error) {
      console.log(user);
      cb(user);
      return;
    }

    socket.join(data.roomname);

    const totalUsers = getUsersInRoom(data.roomname);
    io.to(data.roomname).emit("meta_info", {
      totalActiveUsers: totalUsers.length,
      secretKey: SECRET_KEY,
    });
    socket.to(data.roomname).emit("receive_message", {
      uid: new Date().getMilliseconds(),
      message: `${data.username}, has joined us 🎊`,
      author: "admin",
    });
  });

  socket.on("send_message", (data) => {
    socket.to(data.roomname).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    const leftUser = removeUser(socket.id);
    if (leftUser === undefined) {
      return;
    }
    const totalUsers = getUsersInRoom(leftUser.roomname);
    io.to(leftUser.roomname).emit("meta_info", {
      totalActiveUsers: totalUsers.length,
      secretKey: SECRET_KEY,
    });
    socket.to(leftUser.roomname).emit("receive_message", {
      uid: new Date().getMilliseconds(),
      message: `${leftUser.username}, left the room!`,
      author: "admin",
    });
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(homeDir, "index.html"));
});

server.listen(port, () => {
  console.log(`Server is running on #${port}`);
});
