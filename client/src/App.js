import React from "react";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import AdminPage from "./components/AdminPage";
import UserPage from "./components/UserPage";
import HomePage from "./components/HomePage";
import Marketplace from "./components/Marketplace";
import Trade from "./components/Trade";  // Import Trade page
import "leaflet/dist/leaflet.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/user" element={<UserPage />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/trade" element={<Trade />} />  {/* Added Trade Route */}
    </Routes>
  );
}

export default App;





