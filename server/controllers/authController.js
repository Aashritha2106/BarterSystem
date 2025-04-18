const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Register User
exports.registerUser = async (req, res) => {
    const { name, email, password, role } = req.body; // ✅ Include role here
    if (!name || !email || !password) return res.status(400).json({ msg: 'All fields required' });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: 'User already exists' });

    const user = await User.create({ name, email, password, role }); // ✅ Pass role while creating user
    res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // ✅ Return role in response
        token: generateToken(user.id),
    });
};


exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePic: user.profilePic,
            token: generateToken(user.id),

        });
    } else {
        res.status(401).json({ msg: 'Invalid credentials' });
    }
};
// 🌟 Function to handle profile picture upload
exports.uploadProfilePic = async (req, res) => {
    try {
        console.log(req.file);
        const userId = req.user.id;
        const imagePath = `/uploads/profilePics/${req.file.filename}`;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: imagePath },
            { new: true } // Return the updated document
        );
        res.status(200).json({ profilePic: updatedUser.profilePic });
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ message: "Failed to upload profile picture", error });
    }
};


