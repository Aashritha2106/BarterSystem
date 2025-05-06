import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./marketplace.css";
import { Link } from "react-router-dom";

if (!window.socket) {
  window.socket = io(`${process.env.REACT_APP_API_BASE_URL}`); // Attach socket to global window object
}

const socket = window.socket; // Reference it locally

function Marketplace() {
  const [marketItems, setMarketItems] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState(""); // ✅ Define state
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isLoadingMarket, setIsLoadingMarket] = useState(true);


  const fetchMarketItems = async () => {
    setIsLoadingMarket(true); // Start loading
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
  
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const priceResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/price/allPrices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const itemsData = await response.json();
      const priceArray = await priceResponse.json();
  
      const priceData = priceArray.reduce((acc, item) => {
        acc[item.name] = item.pricePerKg;
        return acc;
      }, {});
  
      if (response.ok && priceResponse.ok) {
        const userItems = itemsData.filter((item) => item.owner._id === userId);
        const filteredItems = itemsData.filter((item) => item.owner._id !== userId);
  
        const groupedItems = filteredItems.reduce((acc, item) => {
          const ownerId = item.owner._id;
  
          if (!acc[ownerId]) {
            acc[ownerId] = {
              owner: item.owner,
              items: [],
              tradeOptions: [],
            };
          }
  
          acc[ownerId].items.push({
            name: item.name,
            quantity: item.quantity,
            image: item.imageUrl,
          });
  
          userItems.forEach((userItem) => {
            if (priceData[userItem.name] && priceData[item.name] && userItem.name !== item.name) {
              const userPrice = priceData[userItem.name];
              const itemPrice = priceData[item.name];
  
              const equivalentQuantity = (userItem.quantity * userPrice) / itemPrice;
  
              acc[ownerId].tradeOptions.push({
                give: userItem.name,
                receive: item.name,
                giveQuantity: userItem.quantity,
                receiveQuantity: equivalentQuantity.toFixed(2),
              });
            }
          });
  
          return acc;
        }, {});
  
        setMarketItems(Object.values(groupedItems));
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching market items:", error);
    } finally {
      setIsLoadingMarket(false); // Stop loading after everything
    }
  };
  
  const fetchUnreadCounts = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/chat/unread/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch unread summary");
      }
  
      const data = await response.json();
      console.log("Fetched unread counts:", data);
      setUnreadCounts(data);
    } catch (error) {
      console.error("Failed to fetch unread summary", error);
    }
  };
  


  // ✅ First useEffect: Fetch initial data (market items & unread counts)
  useEffect(() => {
    fetchMarketItems(); // Load marketplace items
    fetchUnreadCounts(); // Load unread message counts
  
    // Listen for unread messages on login
    socket.on("unreadNotification", (count) => {
      console.log("Unread messages on login:", count);
      if (count > 0) {
        fetchUnreadCounts(); // Refresh unread count immediately
      }
    });
  
    // Listen for real-time updates on unread messages
    socket.on("unreadCount", ({ sender, count }) => {
      setUnreadCounts((prev) => ({ ...prev, [sender]: count }));
    });
    
    

    return () => {
      socket.off("unreadNotification");
      socket.off("unreadCount");
    };
  }, []);
  

// ✅ Second useEffect: Handle incoming messages dynamically
useEffect(() => {
  const handleMessage = (message) => {
    console.log("New message received:", message);

    setMessages((prevMessages) => {
      const exists = prevMessages.some((msg) => msg._id === message._id);
      return exists ? prevMessages : [...prevMessages, message];
    });

    fetchUnreadCounts();
  };

  socket.on("receiveMessage", handleMessage);

  return () => {
    socket.off("receiveMessage", handleMessage);
  };
}, []);


  
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    console.log("Messages updated:", messages);
    setTimeout(scrollToBottom, 100); // Small delay to ensure DOM updates
  }, [messages]);
  

  const handleChat = async (user) => {
    setSelectedUser(user);
  
    try {
      const sender = localStorage.getItem("userId");
  
      // Fetch chat messages
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/chat/${sender}/${user._id}?viewer=${sender}`);
      const data = await response.json();
      console.log("Fetched chat messages:", data);
  
      setMessages(data);
  
      // Mark messages from this user as read
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/chat/markAsRead/${user._id}/${sender}`, {
        method: "PUT",
      });
  
      // ✅ Just update unread count locally for this user
      setUnreadCounts((prevCounts) => ({
        ...prevCounts,
        [user._id]: 0,
      }));
  
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  
  const handleBack = () => {
    navigate("/user");
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() === "") return;
  
    const sender = localStorage.getItem("userId");
    const receiver = selectedUser._id;
  
    try {
      // ✅ Save message to DB
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, receiver, message: messageInput }),
      });
  
      if (!response.ok) throw new Error("Failed to send message");
  
      const savedMessage = await response.json();
      setMessages((prev) => [...prev, savedMessage]);
  
      // ✅ Send message via socket (Only this should trigger UI update)
      socket.emit("sendMessage", savedMessage);
      
  
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  const getUnreadSummary = () => {
    const entries = Object.entries(unreadCounts).filter(([_, count]) => count > 0);
    if (entries.length === 0) return "No new messages";
  
    return entries
      .map(([userId, count]) => {
        const user = marketItems.find((group) => group.owner._id === userId)?.owner;
        return user ? `${count} new message${count > 1 ? "s" : ""} from ${user.name}` : null;
      })
      .filter(Boolean)
      .join(", ");
  };
  
  
  return (
    <div className="marketplace-container">
      <button onClick={handleBack} className="back-btn">
        ⬅ Back to User Page
      </button>
      <h2>🌿 Marketplace - Explore & Chat</h2>
      {Object.keys(unreadCounts).length > 0 && (
  <div className="unread-summary">
    🔔 {getUnreadSummary()}
  </div>
)}
      
      <div className="market-items-grid">
      {isLoadingMarket ? (
    <p>Loading market items...</p>
  ) : marketItems.length === 0 ? (
          <p>No items available from other users right now.</p>
        ) : (
          marketItems.map((group) => (
            <div key={group.owner._id} className="market-item-card">
              <h3>Owner: {group.owner.name}</h3>

              <div className="item-list">
                {group.items.map((item, index) => (
                  <div key={index} className="item-card">
                    {item.image && (
                      <img src={`${process.env.REACT_APP_API_BASE_URL}${item.image}`} alt={item.name} className="item-image" />
                    )}
                    <p><strong>{item.name}</strong>: {item.quantity} kg</p>
                  </div>
                ))}
                
              </div>

              {group.tradeOptions.length > 0 && (
                <div className="trade-options">
                  <h4>Trade Options:</h4>
                  <table className="trade-table">
                    <thead>
                      <tr>
                        <th>Give</th>
                        <th>Quantity</th>
                        <th>Receive</th>
                        <th>Equivalent Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                    {group.tradeOptions.map((trade, index) => {
  const ownerItem = group.items.find((item) => item.name === trade.receive);
  const isExceeding = ownerItem ? parseFloat(trade.receiveQuantity) > ownerItem.quantity : false;

  return (
    <tr key={index}>
      <td>{trade.give}</td>
      <td>{trade.giveQuantity} kg</td>
      <td>{trade.receive}</td>
      <td className={isExceeding ? "exceeding-quantity" : ""}>
        {trade.receiveQuantity} kg
      </td>
    </tr>
  );
})}

                    </tbody>
                  </table>
                </div>
              )}

<button onClick={() => handleChat(group.owner)} className="chat-btn">
  💬 Chat with {group.owner.name}
  {unreadCounts[group.owner._id] > 0 && (
    <span className="unread-badge">{unreadCounts[group.owner._id] || ""}</span>
  )}
</button>


{console.log("Unread Counts:", unreadCounts)}


            </div>
          ))
        )}
      </div>

      <div className="trade-button-container">
        <Link to="/trade">
          <button className="trade-btn">🔄 Go to Trade</button>
        </Link>
      </div>

      {selectedUser && (
        <div className="chat-box">
          <h3>Chat with {selectedUser.name}</h3>
          <div className="chat-window">
  {messages.length === 0 ? (
    <p>No messages yet.</p>
  ) : (
    messages.map((msg, index) => (
      <div key={index} className={`message ${msg.sender === localStorage.getItem("userId") ? "sent" : "received"}`}>
        <div className="message-content">{msg.message}</div>
      </div>
    ))
  )}
  <div ref={messagesEndRef} /> {/* Ensures chat scrolls to the latest message */}
</div>


          <input
  type="text"
  value={messageInput} 
  onChange={(e) => setMessageInput(e.target.value)} 
  placeholder="Type your message..."
  className="chat-input"
/>
<button onClick={handleSendMessage} className="send-chat-btn">Send</button>

          <button onClick={() => setSelectedUser(null)} className="close-chat-btn">Close Chat</button>
        </div>
      )}
    </div>
  );
}

export default Marketplace;



