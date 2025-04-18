
const Chat = require("../models/chatModel");
const mongoose = require("mongoose");

// ✅ Save a new chat message
exports.sendMessage = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    
    const chat = new Chat({ sender, receiver, message, unread: true }); // ✅ Set unread to true
    await chat.save();
    
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: "Failed to save chat", details: error.message });
  }
};

// ✅ Get chat messages between two users & mark received messages as read
exports.getMessages = async (req, res) => {
  
  try {
    const { user1, user2 } = req.params;
    const { viewer } = req.query; // viewer can still be a query param
    
    console.log("Fetching messages", { user1, user2, viewer });
    
    const messages = await Chat.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort("timestamp");

    // mark as read for the viewer
    /*await Chat.updateMany(
      { sender: { $in: [user1, user2] }, receiver: viewer, unread: true, sender: { $ne: viewer } },
      { $set: { unread: false } }
    );*/
    await Chat.updateMany(
      { sender: user2, receiver: viewer, unread: true },
      { $set: { unread: false } }
    );
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages", details: error.message });
  }
};



// ✅ Get unread messages count per sender for a specific user

exports.getUnreadMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCounts = await Chat.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(userId),
          unread: true
        }
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMessages = unreadCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.status(200).json(unreadMessages);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch unread messages",
      details: error.message
    });
  }
};



// ✅ Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    console.log("📥 Marking messages from sender:", sender, "to receiver:", receiver);

    // Update unread messages to read
    await Chat.updateMany(
      { sender, receiver, unread: true },
      { $set: { unread: false } }
    );
    console.log("✅ Marked", result.modifiedCount || result.nModified, "messages as read");

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark messages as read", details: error.message });
  }
};

