import { useState, useEffect } from "react";

const NearbyUsers = () => {
  const [users, setUsers] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      });
    }
  }, []);

  const fetchNearbyUsers = async () => {
    if (!latitude || !longitude) return alert("Location not available yet.");

    const response = await fetch(
      `https://bartersystem-m45b.onrender.com/api/auth/nearbyUsers?latitude=${latitude}&longitude=${longitude}`
    );

    const data = await response.json();
    setUsers(data);
  };

  return (
    <div>
      <button onClick={fetchNearbyUsers} disabled={!latitude || !longitude}>
        Find Nearby Users
      </button>
      <ul>
        {users.map((user) => (
          <li key={user._id}>{user.name} - {user.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default NearbyUsers;
