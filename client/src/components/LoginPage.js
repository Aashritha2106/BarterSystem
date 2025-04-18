import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import "./loginPage.css";


function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate(); // ✅ Initialize navigate

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Login successful:", data);
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data._id);
        localStorage.setItem("name", data.name);
        localStorage.setItem("email", data.email);
        localStorage.setItem("profilePic", data.profilePic);
        if (data.location && data.location.coordinates) {
          localStorage.setItem("latitude", data.location.coordinates[1]); // Latitude is at index 1
          localStorage.setItem("longitude", data.location.coordinates[0]); // Longitude is at index 0
        } else {
          localStorage.removeItem("latitude");
          localStorage.removeItem("longitude");
        }
        if (data.address) {
          localStorage.setItem("address", data.address);
        } else {
          localStorage.removeItem("address");
        }
        
      

        if (data.role === "admin") {
          navigate("/admin"); // ✅ Redirect to admin page
        } else {
          navigate("/user");
        }
      } else {
        console.error("Login failed:", data.msg);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>

      
    </div>
  );
}

export default LoginPage;

