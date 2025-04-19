import { useState } from "react";

const Location = ({ userId }) => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => console.error("Error getting location:", error)
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const updateLocation = async () => {
    if (!latitude || !longitude) return alert("Please get location first!");

    const response = await fetch("https://bartersystem-m45b.onrender.com/api/auth/updateLocation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, latitude, longitude }),
    });

    if (response.ok) {
      alert("Location updated!");
    } else {
      console.error("Error updating location.");
    }
  };

  return (
    <div>
      <button onClick={getLocation}>Get My Location</button>
      <button onClick={updateLocation} disabled={!latitude || !longitude}>
        Save Location
      </button>
      {latitude && longitude && (
        <p>Latitude: {latitude}, Longitude: {longitude}</p>
      )}
    </div>
  );
};

export default Location;
