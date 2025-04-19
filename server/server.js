const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Load env variables and connect DB
dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

// CORS configuration for both Express and Socket.IO
console.log("CLIENT_URL from environment:", process.env.CLIENT_URL);

const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:3000", // Make sure to use the right frontend URL here
  methods: ["GET", "POST"],
  credentials: true,
};

// Apply CORS to both Express and Socket.IO
app.use(express.json());
app.use(cors(corsOptions)); // Apply CORS to Express routes

// Set up Socket.IO with the same CORS options
const io = new Server(server, {
  cors: corsOptions,
});

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes for API endpoints
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/price", require("./routes/priceRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api", require("./routes/tradeRoutes"));

// Chat functionality
const Chat = require("./models/chatModel");
const users = {}; // Store active users with socket IDs

// Socket.IO Connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle user joining and mapping their user ID to the socket
  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} is now online`);
  });

  // Handle sending a message
  socket.on("sendMessage", ({ sender, receiver, message }) => {
    const receiverSocket = users[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", { sender, message });

      // Fetch unread message count and notify receiver
      Chat.countDocuments({ receiver, sender, unread: true }).then((unreadCount) => {
        io.to(receiverSocket).emit("unreadCount", { sender, count: unreadCount });
      });
    }
  });

  // Handle checking unread messages for a user
  socket.on("checkUnread", async (userId) => {
    try {
      const unreadCounts = await Chat.aggregate([
        { $match: { receiver: userId, unread: true } },
        { $group: { _id: "$sender", count: { $sum: 1 } } }
      ]);

      const unreadMessages = unreadCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      socket.emit("unreadNotification", unreadMessages);
    } catch (error) {
      console.error("Error checking unread messages:", error);
    }
  });

  // Mark messages as read
  socket.on("markMessagesAsRead", async ({ sender, receiver }) => {
    try {
      console.log(`[SOCKET] markMessagesAsRead triggered with sender=${sender}, receiver=${receiver}`);
      await Chat.updateMany(
        { sender, receiver, unread: true },
        { $set: { unread: false } }
      );

      // Notify sender that messages were read
      const senderSocket = users[sender];
      if (senderSocket) {
        io.to(senderSocket).emit("messagesRead", { receiver });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    Object.keys(users).forEach((userId) => {
      if (users[userId] === socket.id) delete users[userId];
    });
    console.log("User disconnected:", socket.id);
  });
});

// Optional: Serve frontend build if backend and frontend are deployed together
// const frontendPath = path.join(__dirname, "../client/build");
// app.use(express.static(frontendPath));
// app.get("*", (req, res) => res.sendFile(path.join(frontendPath, "index.html")));

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));










