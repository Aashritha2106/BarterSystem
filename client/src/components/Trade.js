import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./trade.css";

function Trade() {
  const [userItems, setUserItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [equivalentItems, setEquivalentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserItems();
  }, []);

  const fetchUserItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/items/owner/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUserItems(data);
      } else {
        console.error("Failed to fetch user items", data.message);
      }
    } catch (error) {
      console.error("Error fetching user items", error);
    }
  };

  const fetchEquivalentItems = async () => {
    if (!selectedItem || !quantity) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/items/equivalent/${selectedItem}/${quantity}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setEquivalentItems(data.equivalents);
      } else {
        console.error("Failed to fetch equivalent items", data.message);
      }
    } catch (error) {
      console.error("Error fetching equivalent items", error);
    }
    setLoading(false);
  };

  return (
    <div className="trade-container">
      <button onClick={() => navigate("/user")} className="back-btn">⬅ Back</button>
      <h2>🔄 Trade Items</h2>
      <div className="trade-form">
        <label>Select an item to trade:</label>
        <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
          <option value="">-- Select --</option>
          {userItems.map((item) => (
            <option key={item._id} value={item._id}>{item.name} ({item.quantity} kg)</option>
          ))}
        </select>
        <label>Enter quantity:</label>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <button onClick={fetchEquivalentItems} disabled={loading}>
          {loading ? "Fetching..." : "Find Equivalent Items"}
        </button>
      </div>
      {equivalentItems.length > 0 && (
        <div className="equivalent-items">
          <h3>Possible Trades</h3>
          <table>
            <thead>
              <tr>
                <th>Your Item</th>
                <th>Quantity</th>
                <th>Equivalent Item</th>
                <th>Equivalent Quantity</th>
                <th>Trade</th>
              </tr>
            </thead>
            <tbody>
              {equivalentItems.map((item, index) => (
                <tr key={index}>
                  <td>{selectedItem}</td>
                  <td>{quantity} kg</td>
                  <td>{item.name}</td>
                  <td>{item.equivalentQuantity} kg</td>
                  <td><button>✅ Select</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Trade;