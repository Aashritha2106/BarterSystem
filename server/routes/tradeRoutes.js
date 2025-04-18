const express = require("express");
const router = express.Router();
const tradeController = require("../controllers/tradeController");

router.post("/trades", tradeController.createTrade);
router.get("/trades/:userId", tradeController.getUserTrades);
router.put("/trades/:tradeId/accept", tradeController.acceptTrade);
router.put("/trades/:tradeId/reject", tradeController.rejectTrade);
router.delete("/trades/:tradeId", tradeController.deleteTrade);

module.exports = router;
