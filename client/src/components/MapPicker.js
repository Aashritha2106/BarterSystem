import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapPicker = ({ onLocationSelect }) => {
  const [position, setPosition] = useState([20, 78]); // Default center (India)
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Fetch location suggestions while typing
  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]); // Show suggestions only after 3+ characters
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Select a location from the dropdown
  const selectLocation = (lat, lon, display_name) => {
    setPosition([parseFloat(lat), parseFloat(lon)]);
    onLocationSelect(parseFloat(lat), parseFloat(lon));
    setLocationName(display_name);
    setSuggestions([]); // Clear dropdown
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });

    return position ? <Marker position={position} icon={markerIcon} /> : null;
  }

  function ChangeView({ center }) {
    const map = useMap();
    map.setView(center, 12); // Zoom in when location is found
    return null;
  }

  return (
    <div style={{ position: "relative" }}>
      {/* ✅ Manual Location Input with Autocomplete */}
      <input
        type="text"
        value={locationName}
        onChange={(e) => {
          setLocationName(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        placeholder="Enter location (e.g., Mumbai, Delhi)"
        style={{ marginBottom: "10px", width: "100%", padding: "5px" }}
      />

      {/* 🔽 Dropdown with location suggestions */}
      {suggestions.length > 0 && (
        <ul style={{
          listStyle: "none",
          padding: "5px",
          border: "1px solid #ccc",
          background: "#fff",
          position: "absolute",
          width: "100%",
          maxHeight: "150px",
          overflowY: "auto",
          zIndex: 1000,
        }}>
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => selectLocation(item.lat, item.lon, item.display_name)}
              style={{
                padding: "5px",
                cursor: "pointer",
                borderBottom: "1px solid #ddd",
              }}
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}

      {/* 🗺️ Map Component */}
      <MapContainer center={position} zoom={10} scrollWheelZoom={true} style={{ height: "300px", width: "100%" }}>
        <ChangeView center={position} />
        <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
        <LocationMarker />
      </MapContainer>
    </div>
  );
};

export default MapPicker;








