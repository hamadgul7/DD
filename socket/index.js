const { Server } = require("socket.io");
const http = require("http");
const server = http.createServer();

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

let onlineUsers = [];

console.log("onlineUsers", onlineUsers);

io.on("connection", (socket) => {
    console.log("New connection", socket.id);

  // Add new user to online list
    socket.on("addNewUser", (userId) => {
        if (!onlineUsers.some(user => user.userId === userId)) {
            onlineUsers.push({
                userId,
                socketId: socket.id
            });
        }
        io.emit("getOnlineUsers", onlineUsers);
    });

    // Handle incoming messages
    socket.on("sendMessage", (message) => {
        console.log("Received message from client:", message);
        
        const recipient = onlineUsers.find(user => user.userId === message.recipientId);
        console.log("Recipient found:", recipient);

        if (recipient) {
            console.log("Emitting message to recipient:", recipient.socketId);
            io.to(recipient.socketId).emit("receiveMessage", message);
        }

        // Also emit to sender for confirmation
        console.log("Emitting message back to sender:", socket.id);
        socket.emit("messageSent", message);
    });

    // Real-time message deletion (no DB involved)
    socket.on("deleteMessage", ({ messageId, recipientId }) => {
        console.log(`Received delete request for message ID: ${messageId}`);

        // Notify recipient if online
        const recipient = onlineUsers.find(user => user.userId === recipientId);
        if (recipient) {
            io.to(recipient.socketId).emit("messageDeleted", { messageId });
        }

        // Also notify sender (optional but recommended)
        socket.emit("messageDeleted", { messageId });
    });


    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id);
        io.emit("getOnlineUsers", onlineUsers);
    });
});

server.listen(5000, () => {
    console.log("Socket.IO server running on port 5000");
});