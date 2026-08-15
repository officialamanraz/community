const mysql = require('mysql2/promise');
require('dotenv').config(); // .env file load karne ke liye

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0,
//     connectTimeout: 20000 
// });
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL, // <-- 5 alag variables ki jagah ab sirf ye single URL
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000,
    ssl: {
        rejectUnauthorized: false // <-- Aiven cloud database se securely connect hone ke liye zaroori
    }
});

module.exports = pool;

