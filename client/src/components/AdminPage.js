import React, { useState, useEffect } from "react";
import "./adminPage.css";

function AdminPage() {
  const [itemName, setItemName] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [items, setItems] = useState([]);

  // Fetch existing items
  const fetchPrices = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/price/allPrices`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setItems(data);
      } else {
        console.error("❌ Failed to fetch prices:", data.message);
      }
    } catch (error) {
      console.error("🚨 Error fetching prices:", error);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // Set or update price
  const handleSetPrice = async (id, updatedName, updatedPrice) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/price/setPrice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: updatedName, pricePerKg: updatedPrice }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Price for ${updatedName} set successfully:`, data);
        fetchPrices();
      } else {
        console.error("❌ Failed to set price:", data.message);
      }
    } catch (error) {
      console.error("🚨 Error setting price:", error);
    }
  };

  return (
    <div className="admin-container">
      <h2 className="admin-header">Admin - Manage Prices</h2>
      
      {/* Add New Price Section */}
      <div className="admin-form">
        <input
          type="text"
          placeholder="Item Name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="admin-input"
        />
        <input
          type="number"
          placeholder="Price per kg"
          value={pricePerKg}
          onChange={(e) => setPricePerKg(e.target.value)}
          className="admin-input"
        />
        <button onClick={() => handleSetPrice(null, itemName, pricePerKg)} className="admin-button">
          Add / Update Price
        </button>
      </div>

      {/* Existing Items Section */}
      <div className="items-container">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item._id} className="item-card">
              <span className="item-name">{item.name}</span>
              <input
                type="number"
                value={item.pricePerKg}
                onChange={(e) => {
                  const updatedItems = items.map((i) =>
                    i._id === item._id ? { ...i, pricePerKg: e.target.value } : i
                  );
                  setItems(updatedItems);
                }}
                className="item-price"
              />
              <button onClick={() => handleSetPrice(item._id, item.name, item.pricePerKg)} className="update-button">
                Update
              </button>
            </div>
          ))
        ) : (
          <p className="no-items">No items available</p>
        )}
      </div>
    </div>
  );
}

export default AdminPage;


