import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./userPage.css";
import MapPicker from "./MapPicker";
import axios from "axios";

function UserPage() {
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [image, setImage] = useState(null);
  const [itemsList, setItemsList] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [availableItems, setAvailableItems] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [userName, setUserName] = useState(localStorage.getItem("name") || "");
  const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic") || null);
  const userEmail = localStorage.getItem("email");
  const [editingItem, setEditingItem] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState(localStorage.getItem("address") || "");
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  

  const navigate = useNavigate();

  const fetchAvailableItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/price/allPrices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setAvailableItems(data);
      else console.error("Failed to fetch available items:", data.message);
    } catch (error) {
      console.error("Error fetching available items:", error);
    }
  };

  const fetchUserItems = async () => {
    setIsLoadingItems(true); // Start loading
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/items/owner/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setItemsList(data);
      else console.error("Failed to fetch user items:", data.message);
    } catch (error) {
      console.error("Error fetching user items:", error);
    } finally {
      setIsLoadingItems(false); // Stop loading regardless of success or failure
    }
  };
  

  useEffect(() => {
    fetchAvailableItems();
    fetchUserItems();
    setUserName(localStorage.getItem("name") || "");
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const formData = new FormData();

      formData.append("name", item);
      formData.append("category", "vegetable");
      formData.append("quantity", quantity);
      formData.append("owner", userId);
      if (image) formData.append("image", image);

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/items`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`✅ Item "${item}" added successfully!`);
        setItem("");
        setQuantity("");
        setImage(null);
        fetchUserItems();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        console.error("Failed to add item:", data.message);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return alert("No file selected.");
  
    try {
      const formData = new FormData();
      formData.append("profilePic", selectedFile);
  
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/uploadPic`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      const data = await response.json();
      if (response.ok) {
        const relativePath = data.profilePic; // e.g., /uploads/img123.jpg
        setProfilePic(relativePath);
        localStorage.setItem("profilePic", relativePath);
        setSelectedFile(null);
        alert("Upload successful!");
      } else {
        console.error("Upload failed:", data.message);
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error uploading profile pic:", error);
      alert("An error occurred while uploading.");
    }
  };
  
  const handleEditItem = (item) => {
    setEditingItem(item);
    setItem(item.name);
    setQuantity(item.quantity);
    setImage(null); // Reset image input
  };
  
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", item);
      formData.append("quantity", quantity);
      if (image) formData.append("image", image);
  
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/items/${editingItem._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`✅ Item "${item}" updated successfully!`);
        setItem("");
        setQuantity("");
        setImage(null);
        setEditingItem(null);
        fetchUserItems();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else console.error("Failed to update item:", data.message);
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };
  const handleDeleteItem = async (id) => {
    if (!window.confirm("❓ Are you sure you want to delete this item?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage("🗑️ Item deleted successfully!");
        fetchUserItems();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else console.error("Failed to delete item:", data.message);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };
  

  const handleExploreMarket = () => {
    navigate("/marketplace");
  };

  const fetchUserAddress = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/getUser/${userId}`);
      const data = await response.json();
  
      if (response.ok) {
        setAddress(data.address); // ✅ Set the stored address
        localStorage.setItem("address", data.address); // ✅ Sync local storage
        // ✅ Also store and set latitude & longitude
        if (data.location && typeof data.location.latitude !== "undefined" && typeof data.location.longitude !== "undefined") {
          setLatitude(data.location.latitude);
          setLongitude(data.location.longitude);
          localStorage.setItem("latitude", data.location.latitude);
          localStorage.setItem("longitude", data.location.longitude);
      } else {
          console.warn("⚠️ Location data is missing or incomplete.");
      }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };
  
  useEffect(() => {
    fetchUserAddress();
  }, []); // ✅ Only fetch once when the component mounts
  useEffect(() => {
    const storedPic = localStorage.getItem("profilePic");
    if (storedPic) {
      setProfilePic(storedPic);
    }
  }, []);
  
  

  const updateLocation = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("User not found! Please login first.");
      return;
    }
  
    if (latitude == null || longitude == null) {
      alert("Please select a location first.");
      return;
    }
  
    console.log("📍 Final Coordinates Before Sending:", { latitude, longitude });
  
    try {
      // Fetch address using manually selected coordinates
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      const newAddress = data.display_name;
  
      if (!newAddress) {
        alert("Failed to fetch address.");
        return;
      }
  
      console.log("📌 Sending to backend:", { latitude, longitude, newAddress });
  
      // Send updated location to backend
      const updateResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auth/updateLocation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, latitude, longitude, address: newAddress }),
      });
  
      if (updateResponse.ok) {
        setAddress(newAddress);
        localStorage.setItem("address", newAddress);
        alert("Location updated successfully!");
      } else {
        alert("Failed to update location.");
      }
    } catch (error) {
      console.error("❌ Error updating location:", error);
    }
  };
  
  
  const fetchNearbyUsers = async () => {
    const userId = localStorage.getItem("userId"); // Get logged-in user ID

    if (!latitude || !longitude || !userId) return;

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/auth/nearbyUsers`, {
        params: { latitude, longitude, userId },
      });

      setNearbyUsers(response.data);
    } catch (error) {
      console.error("Error fetching nearby users:", error);
    }
};



  // Fetch nearby users when latitude & longitude are set
  useEffect(() => {
    if (latitude && longitude) {
      fetchNearbyUsers();
    }
  }, [latitude, longitude]);

  return (
    <div className="user-container">
      {/* Left Section: Profile, Location, Nearby Users */}
      <div className="left-section">
        {/* Profile Section */}
        <div className="profile-section">
          <h2>Welcome, {userName}!</h2>
          <div className="profile-details">
            <div className="profile-pic-container">
              {profilePic ? (
                <img src={`${process.env.REACT_APP_API_BASE_URL}${profilePic}`} alt="Profile" className="profile-pic" />
              ) : (
                <div className="placeholder-pic">No Image</div>
              )}
              <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
              <button onClick={handleUploadClick} disabled={!selectedFile}>Upload Image</button>
              <p>Upload your Bitmoji image</p>
            </div>
            <div className="user-info">
              <p>📧 Email: {userEmail}</p>
            </div>
          </div>
        </div>
  
        {/* Location Picker */}
        <div className="location-section">
          <h2>Set Your Location</h2>
          <MapPicker
            onLocationSelect={(lat, lng) => {
              console.log("New Map Selection:", { lat, lng });
              setLatitude(lat);
              setLongitude(lng);
            }}
          />
          <button onClick={updateLocation} disabled={!latitude || !longitude}>
            Save Location
          </button>
          {/* ✅ Show saved address */}
  <p><strong>Saved Address:</strong> {address ? address : "No address available"}</p>
        </div>
  
        {/* Nearby Users */}
        <div className="nearby-users">
          <h2>Nearby Users</h2>
          {nearbyUsers.length > 0 ? (
            <ul>
              {nearbyUsers.map((user) => (
                <li key={user._id}>
                <p><strong>👤 {user.name}</strong><br /></p>
                <p style={{ marginTop: "5px" }}>📍 <strong>Address:</strong> {user.address ? user.address : "No address available"}</p>
              </li>
              
              ))}
            </ul>
          ) : (
            <p className="empty-state">No nearby users found.</p>
          )}
        </div>
      </div>
  
      {/* Right Section: Barter Items & Marketplace */}
      <div className="right-section">
        <div className="user-box">
          <h2>Add Items to Barter</h2>
          {successMessage && <p className="success-message">{successMessage}</p>}
  
          <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="item-form">
            <select value={item} onChange={(e) => setItem(e.target.value)} required>
              <option value="">Select Item</option>
              {availableItems.map((i) => (
                <option key={i._id} value={i.name}>
                  {i.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantity (kg)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
            <button type="submit" disabled={!item || !quantity || !image}>
              {editingItem ? "Update Item" : "Add Item"}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setItem("");
                  setQuantity("");
                  setImage(null);
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
  
          {/* User's Items List */}
          <h3>Your Items</h3>
          {isLoadingItems ? (
  <p>Loading your items...</p>
) : itemsList.length > 0 ? (
  <ul>
    {itemsList.map((userItem) => (
      <li key={userItem._id}>
        {userItem.imageUrl && (
          <img
            src={`${process.env.REACT_APP_API_BASE_URL}${userItem.imageUrl}`}
            alt={userItem.name}
            className="item-image"
          />
        )}
        {userItem.name} - {userItem.quantity} kg
        <button onClick={() => handleEditItem(userItem)}>✏️ Edit</button>
        <button onClick={() => handleDeleteItem(userItem._id)}>🗑️ Delete</button>
      </li>
    ))}
  </ul>
) : (
  <p className="empty-state">You haven't added any items yet.</p>
)}

  
          <button onClick={handleExploreMarket} className="explore-market-btn">
            Explore Marketplace & Chat
          </button>
        </div>
      </div>
    </div>
  );
  
  
}

export default UserPage;






