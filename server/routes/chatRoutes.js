const express = require("express");
const { sendMessage, getMessages, getUnreadMessages, markMessagesAsRead } = require("../controllers/chatController");

const router = express.Router();

router.get("/unread/:userId", getUnreadMessages);
router.put("/markAsRead/:sender/:receiver", markMessagesAsRead); // ✅ Add this route
router.post("/", sendMessage);
router.get("/:user1/:user2", getMessages);

module.exports = router;




