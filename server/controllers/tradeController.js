const Trade = require("../models/tradeModel");
const Item = require("../models/itemModel");

exports.createTrade = async (req, res) => {
  try {
    const { fromUser, toUser, offeredItem, requestedItem } = req.body;

    const trade = await Trade.create({
      fromUser,
      toUser,
      offeredItem,
      requestedItem,
    });

    res.status(201).json(trade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserTrades = async (req, res) => {
  try {
    const userId = req.params.userId;
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
    })
      .populate("offeredItem.item")
      .populate("requestedItem.item")
      .populate("fromUser")
      .populate("toUser");

    res.status(200).json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptTrade = async (req, res) => {
    try {
      const tradeId = req.params.tradeId;
      const trade = await Trade.findById(tradeId);
  
      if (!trade || trade.status !== "pending") {
        return res.status(400).json({ error: "Invalid or already processed trade" });
      }
  
      const offered = await Item.findById(trade.offeredItem.item);
      const requested = await Item.findById(trade.requestedItem.item);
  
      if (
        !offered || !requested ||
        offered.owner.toString() !== trade.fromUser.toString() ||
        requested.owner.toString() !== trade.toUser.toString() ||
        offered.quantity < trade.offeredItem.quantity ||
        requested.quantity < trade.requestedItem.quantity
      ) {
        return res.status(400).json({ error: "Invalid trade or insufficient quantity" });
      }
      const roundTo = (num, decimals = 2) => {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
      };
      
      // Deduct quantities with rounding
      offered.quantity = roundTo(offered.quantity - trade.offeredItem.quantity);
      requested.quantity = roundTo(requested.quantity - trade.requestedItem.quantity);
      
      await offered.save();
      await requested.save();
  
      // ✅ Mark the trade as accepted
      trade.status = "accepted";
      await trade.save();
  
      res.status(200).json({ message: "Trade accepted successfully", trade });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

exports.rejectTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.tradeId);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    trade.status = "rejected";
    await trade.save();

    res.status(200).json({ message: "Trade rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    const trade = await Trade.findByIdAndDelete(req.params.tradeId);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    res.status(200).json({ message: "Trade deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



  