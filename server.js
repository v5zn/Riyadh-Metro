const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// إنشاء اتصال بقاعدة البيانات
const db = mysql.createConnection({
    host: "localhost",
    user: "root", // اسم المستخدم الخاص بقاعدة البيانات
    password: "your_password", // كلمة المرور الخاصة بقاعدة البيانات
    database: "Riyadhmetro" // اسم قاعدة البيانات
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to the database");
});


app.post("/signup", (req, res) => {
    const { username, email, password } = req.body;
    const query = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error registering user" });
        }
        res.status(200).json({ success: true, message: "User registered successfully" });
    });
});


app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(query, [email, password], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error logging in" });
        }
        if (result.length > 0) {
            const user = result[0];
            res.status(200).json({ 
                success: true, 
                message: "Login successful",
                user: { id: user.id, username: user.username, email: user.email }
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    });
});


app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
app.post("/update", (req, res) => {
    const { userId, field, value } = req.body;
    const query = `UPDATE users SET ${field} = ? WHERE id = ?`;
    
    db.query(query, [value, userId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Error updating user information" 
            });
        }
        
        if (result.affectedRows > 0) {
            res.status(200).json({ 
                success: true, 
                message: "User information updated successfully" 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }
    });
});