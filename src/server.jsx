const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3001;

// Open the database connection
const db = new sqlite3.Database('./src/data/sire_profile.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Could not open database', err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });

// API endpoint to get data with optional filters
app.get('/api/sire_report', (req, res) => {
  const { winPercentMin = 0, winPercentMax = 100, rb2Min = 0, rb2Max = 100, country } = req.query;
  
  // Build the SQL query with optional filters
  let sql = `SELECT * FROM sire_profile WHERE Win_Percent BETWEEN ? AND ? AND RB2 BETWEEN ? AND ?`;
  const params = [winPercentMin, winPercentMax, rb2Min, rb2Max];
  
  if (country) {
    sql += ' AND country = ?';
    params.push(country);
  }
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});