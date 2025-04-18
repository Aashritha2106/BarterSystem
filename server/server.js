/*const exp = require("express");
const app = exp();
app.use(exp.json()); // Middleware to parse JSON request bodies

const mclient = require("mongodb").MongoClient;
const Dburl = "mongodb+srv://aashritha:aashu123%40@cluster0.453we.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tlsAllowInvalidCertificates=true";

// MongoDB connection
mclient.connect(Dburl)
  .then((client) => {
    const dbobj = client.db("barter");
    const userobj = dbobj.collection("user collection");
    console.log("MongoDB connection successful");

    // ✅ Route to add a user
    app.post("/adduser", async (req, res) => {
      try {
        const user = req.body;
        const result = await userobj.insertOne(user); // Insert user into collection
        res.status(201).send(`User added with ID: ${result.insertedId}`);
      } catch (err) {
        res.status(500).send("Error adding user: " + err);
      }
    });

  })
  .catch((err) => console.log("MongoDB connection error:", err));

app.listen(4000, () => console.log("Server listening on port 4000"));*/
/*const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require("path");
const { protect } = require('./middleware/authMiddleware');
const User = require('./models/userModel');
// Load env variables
dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/price', require('./routes/priceRoutes'));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const multer = require("multer");


// Configure storage
const storage = multer.diskStorage({
  destination: "./uploads/profilePics/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

app.post(
  "/api/profile/uploadPic",
  protect,                    // ✅ Add this line to ensure req.user is set
  upload.single("profilePic"),
  async (req, res) => {
    try {
      console.log(req.user); // 🔍 Debug: Check if user is available here
      const userId = req.user.id; // Should now work without errors
      const imagePath = `/uploads/profilePics/${req.file.filename}`;
      await User.findByIdAndUpdate(userId, { profilePic: imagePath });
      res.status(200).json({ profilePic: imagePath });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload profile picture", error });
    }
  }
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));*/

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
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust based on frontend URL
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/price", require("./routes/priceRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api", require("./routes/tradeRoutes"));

// Chat functionality
const Chat = require("./models/chatModel");
const users = {}; // Store active users with socket IDs

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // User joins and maps their user ID to the socket
  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} is now online`);
  });

  // Handle message sending
  socket.on("sendMessage", ({ sender, receiver, message }) => {
    const receiverSocket = users[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receiveMessage", { sender, message });
  
      // Fetch unread count and notify
      Chat.countDocuments({ receiver, sender, unread: true }).then((unreadCount) => {
        io.to(receiverSocket).emit("unreadCount", { sender, count: unreadCount });
      });
    }
  });
  

  // ✅ Notify user on login if they have unread messages
  socket.on("checkUnread", async (userId) => {
    try {
      // Count unread messages grouped by sender
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

  // ✅ Mark messages as read when the user reads them
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

  // Handle user disconnect
  socket.on("disconnect", () => {
    Object.keys(users).forEach((userId) => {
      if (users[userId] === socket.id) delete users[userId];
    });
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));





