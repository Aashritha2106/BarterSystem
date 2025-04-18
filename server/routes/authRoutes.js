const express = require('express');
const { registerUser, loginUser, uploadProfilePic } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const User = require('../models/userModel'); // ✅ Import the User model
const router = express.Router();

// Configure storage for profile picture uploads
const storage = multer.diskStorage({
    destination: "./uploads/profilePics/",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// 🌟 Endpoint to upload profile picture
router.post('/uploadPic', protect, upload.single("profilePic"), uploadProfilePic);

// 🌟 Register & Login Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// 🌍 Update User Location
router.put("/updateLocation", async (req, res) => {
    const { userId, latitude, longitude, address } = req.body;

    if (!userId || latitude == null || longitude == null || !address) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                location: { type: "Point", coordinates: [longitude, latitude] },
                address // 🌟 Update the address too
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Location and address updated successfully!", user });
    } catch (error) {
        console.error("Error updating location:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// 🔎 Get Nearby Users
router.get("/nearbyUsers", async (req, res) => {
    const { latitude, longitude, userId } = req.query; // Include userId to filter out self

    if (!latitude || !longitude || !userId) {
        return res.status(400).json({ message: "Latitude, Longitude, and User ID are required" });
    }

    try {
        const users = await User.find(
            {
                _id: { $ne: userId }, // Exclude the logged-in user
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                        $maxDistance: 10000, // 10 km radius
                    },
                },
            },
            "name email address" // Only return necessary fields
        );

        res.json(users);
    } catch (error) {
        console.error("Error fetching nearby users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.get("/getUser/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // ✅ Ensure `location` exists before sending
        const location = user.location && Array.isArray(user.location.coordinates) && user.location.coordinates.length === 2 
            ? { latitude: user.location.coordinates[1], longitude: user.location.coordinates[0] }
            : null;

        res.json({ 
            address: user.address || "",  
            location: location  // ✅ Send location with latitude & longitude
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ msg: "Server error" });
    }
});

  


module.exports = router;


