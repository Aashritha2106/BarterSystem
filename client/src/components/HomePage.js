// components/HomePage.js
import React from "react";
import { Link } from "react-router-dom";
import "./homePage.css"; // Importing the CSS file
import logo from "../assets/barter-logo.png.jpg"; // Place a logo image in 'src/assets/'

function HomePage() {
  return (
    <div className="home-container">
      <img src={logo} alt="Barter App Logo" className="logo" />
      <div className="app-name">Organic Barter Hub</div>
      <h1>Exchange Organic Fruits & Vegetables - No Money Involved!</h1>
      <div className="nav-links">
        <Link to="/login">Login</Link>
        <Link to="/signup">Sign Up</Link>
      </div>
    </div>
  );
}

export default HomePage;
