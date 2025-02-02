const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "your_password", // Enter your password here if you set one
    database: "Riyadhmetro",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.connect((err) => {
    if (err) {
        console.error("Database connection error:", err);
        if (err.code === 'ER_BAD_DB_ERROR') {
            const tempDb = mysql.createConnection({
                host: "localhost",
                user: "root",
                password: ""
            });

            tempDb.connect((tempErr) => {
                if (tempErr) {
                    console.error("Connection error:", tempErr);
                    return;
                }

                tempDb.query("CREATE DATABASE IF NOT EXISTS Riyadhmetro", (createErr) => {
                    if (createErr) {
                        console.error("Error creating database:", createErr);
                        return;
                    }
                    console.log("Database created successfully");
                    db.connect();
                });
            });
        }
        return;
    }
    console.log("Database connected successfully");
});

db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reconnecting to database...');
        db.connect();
    }
});

const ADMIN_EMAIL = 'abdullah@gmail.com';

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

app.post("/update", (req, res) => {
    const { userId, field, value } = req.body;

    if (!userId || !field || !value) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    const dbField = field === 'username' ? 'username' :
        field === 'email' ? 'email' :
            field === 'password' ? 'password' : null;

    if (!dbField) {
        return res.status(400).json({
            success: false,
            message: "Invalid field"
        });
    }

    const query = `UPDATE users SET ${dbField} = ? WHERE id = ?`;

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
                message: "Updated successfully"
            });
        } else {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
    });
});

app.post("/purchase-ticket", (req, res) => {
    const { userId, type } = req.body;

    // Get current price from ticket_prices table
    db.query("SELECT price FROM ticket_prices WHERE type = ?", [type], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Error getting current ticket price"
            });
        }

        const currentPrice = results[0].price;
        const ticketNumber = generateTicketNumber();
        const startTime = new Date();
        const endTime = calculateEndTime(type, startTime);
        const status = 'active';

        const query = `
        INSERT INTO tickets 
        (user_id, ticket_number, ticket_type, price, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(query, [
            userId,
            ticketNumber,
            type,
            currentPrice,
            startTime,
            endTime,
            status
        ], (err, result) => {
            if (err) {
                console.error("Error purchasing ticket:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error purchasing ticket"
                });
            }

            res.json({
                success: true,
                ticket: {
                    id: result.insertId,
                    ticket_number: ticketNumber,
                    ticket_type: type,
                    price: currentPrice,
                    start_time: startTime,
                    end_time: endTime,
                    status: status
                }
            });
        });
    });
});

app.get("/user-tickets/:userId", (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT 
            t.*,
            u.username,
            u.email,
            CASE 
                WHEN t.end_time > NOW() THEN 'active'
                ELSE 'expired'
            END as status
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.user_id = ?
        ORDER BY t.start_time DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching tickets:", err);
            return res.status(500).json({
                success: false,
                message: "Error fetching tickets"
            });
        }

        res.json({
            success: true,
            tickets: results
        });
    });
});

app.post("/check-admin", (req, res) => {
    const { email } = req.body;
    res.json({ isAdmin: email === ADMIN_EMAIL });
});

app.post("/update-ticket-price", (req, res) => {
    const { email, type, price } = req.body;
    if (email !== ADMIN_EMAIL) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const query = "UPDATE ticket_prices SET price = ? WHERE type = ?";
    db.query(query, [price, type], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error updating price" });
        }
        res.json({ success: true });
    });
});

app.post("/create-announcement", (req, res) => {
    const { email, message, expiryDate } = req.body;
    
    if (email !== ADMIN_EMAIL) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    try {
        const expiry = new Date(expiryDate);
        if (isNaN(expiry.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid expiry date" });
        }

        const query = "INSERT INTO announcements (message, expiry_date) VALUES (?, ?)";
        db.query(query, [message, expiry], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, message: "Error creating announcement" });
            }
            res.json({ success: true, id: result.insertId });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get("/announcements", (req, res) => {
    const query = `
        SELECT 
            id,
            message,
            expiry_date,
            created_at
        FROM announcements 
        WHERE expiry_date > NOW() 
        ORDER BY created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: "Error fetching announcements" 
            });
        }
        
        const formattedResults = results.map(announcement => ({
            ...announcement,
            formatted_expiry: new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Riyadh',
                numberingSystem: 'latn'
            }).format(new Date(announcement.expiry_date))
        }));

        res.json({ 
            success: true, 
            announcements: formattedResults 
        });
    });
});

app.get("/ticket-prices", (req, res) => {
    const query = "SELECT type, price, duration FROM ticket_prices ORDER BY price ASC";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.json({
                success: true,
                prices: [
                    { type: '2 Hours pass', price: 4.00, duration: '2 hours' },
                    { type: '3 Days pass', price: 20.00, duration: '3 days' },
                    { type: '7 Days pass', price: 40.00, duration: '7 days' },
                    { type: '30 Days pass', price: 140.00, duration: '30 days' }
                ]
            });
        }
        
        res.json({
            success: true,
            prices: results
        });
    });
});

app.post("/update-ticket-price", (req, res) => {
    const { email, type, price } = req.body;
    
    if (email !== ADMIN_EMAIL) {
        return res.status(403).json({ 
            success: false, 
            message: "Unauthorized - Admin access required" 
        });
    }

    if (!type || price === undefined || price < 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid price or ticket type" 
        });
    }

    const query = "UPDATE ticket_prices SET price = ? WHERE type = ?";
    db.query(query, [price, type], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: "Error updating price" 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Ticket type not found" 
            });
        }

        res.json({ 
            success: true,
            message: "Price updated successfully" 
        });
    });
});

app.get("/all-tickets", (req, res) => {
    const query = `
        SELECT 
            tickets.*,
            users.username,
            users.email,
            CASE 
                WHEN tickets.end_time > NOW() THEN 'active'
                ELSE 'expired'
            END as status
        FROM tickets 
        JOIN users ON tickets.user_id = users.id
        ORDER BY tickets.start_time DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching tickets:", err);
            return res.status(500).json({ 
                success: false, 
                message: "Error fetching tickets" 
            });
        }
        res.json({
            success: true,
            tickets: results
        });
    });
});

app.post("/update-ticket", (req, res) => {
    const { email, ticketId, status } = req.body;
    
    if (email !== ADMIN_EMAIL) {
        return res.status(403).json({ 
            success: false, 
            message: "Unauthorized" 
        });
    }

    const query = "UPDATE tickets SET status = ? WHERE id = ?";
    db.query(query, [status, ticketId], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: "Error updating ticket" 
            });
        }
        res.json({ success: true });
    });
});

app.delete('/delete-announcement/:id', (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM announcements WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error('Error checking announcement:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        db.query("DELETE FROM announcements WHERE id = ?", [id], (error, results) => {
            if (error) {
                console.error('Error deleting announcement:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete announcement'
                });
            }

            res.json({
                success: true,
                message: 'Announcement deleted successfully'
            });
        });
    });
});

function generateTicketNumber() {
    return 'TKT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function calculateEndTime(type, start) {
    const durations = {
        '2 Hours pass': 2 * 60 * 60 * 1000,
        '3 Days pass': 3 * 24 * 60 * 60 * 1000,
        '7 Days pass': 7 * 24 * 60 * 60 * 1000,
        '30 Days pass': 30 * 24 * 60 * 60 * 1000
    };
    return new Date(start.getTime() + durations[type]);
}

app.listen(3000, () => {
    console.log("Server running on port 3000");
    console.log("Making sure all required tables exist...");
    
    const requiredTables = [
        {
            name: 'users',
            query: `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL
            )`
        },
        {
            name: 'tickets',
            query: `CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                ticket_number VARCHAR(100) UNIQUE NOT NULL,
                ticket_type VARCHAR(50) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                status VARCHAR(20) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`
        },
        {
            name: 'announcements',
            query: `CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                message TEXT NOT NULL,
                expiry_date DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        },
        {
            name: 'ticket_prices',
            query: `CREATE TABLE IF NOT EXISTS ticket_prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) UNIQUE NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                duration VARCHAR(20) NOT NULL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
        }
    ];

    requiredTables.forEach(table => {
        db.query(table.query, (err) => {
            if (err) {
                console.error(`Error creating ${table.name} table:`, err);
            } else {
                console.log(`${table.name} table is ready`);
            }
        });
    });
});
