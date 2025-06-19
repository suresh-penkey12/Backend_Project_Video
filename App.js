const express =require("express");
let app=express();
let http = require("http");
let {Server} = require("socket.io");
let dbConnect =require("./database.js");
dbConnect();
const server =http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173","http://localhost:5174", "https://skill-sync-front-end-fisk.vercel.app"],
      credentials: true,
    },
});
app.use(express.json());
let cors=require("cors");
app.use(cors({ origin: ["http://localhost:5173","http://localhost:5174", "https://skill-sync-front-end-fisk.vercel.app"], credentials: true }));
let AuthRouter = require("./Router/Authentication_router.js");
let connectionRouter  =require("./Router/connection_router.js");
app.use("/Auth",AuthRouter);
app.use("/connection",connectionRouter)
app.get("/",(req,res)=>{
    res.send("elcome to ");
})
//webRTC connection setUp
const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });
  socket.on("chat:message", ({ message, sender }) => {
    console.log(`📩 Chat Message Received: ${message} from ${sender}`);

    // Broadcast to all connected clients
    io.emit("chat:message", { sender, message });
   });

  
  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
  socket.on("call:end", ({ to }) => {
    io.to(to).emit("call:ended");
  });
   
});

server.listen(3002,()=>{
    console.log("server started");
})


