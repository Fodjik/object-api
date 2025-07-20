const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use Render's PORT or fallback to 3000

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'objects.db'); // Ensure path is relative to project root
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Database connected');
    db.run(`
      CREATE TABLE IF NOT EXISTS objects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        length REAL NOT NULL,
        width REAL NOT NULL,
        depth REAL NOT NULL,
        surface TEXT NOT NULL,
        location TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Table created or already exists');
      }
    });
  }
});

// Close database connection on process termination
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing the database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

// API routes
app.get('/api/objects', (req, res) => {
  db.all('SELECT * FROM objects', [], (err, rows) => {
    if (err) {
      console.error('Error fetching objects:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/objects/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM objects WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching object:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/objects', (req, res) => {
  const { name, length, width, depth, surface, location } = req.body;
  if (!name || !length || !width || !depth || !surface || !location) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  const sql = 'INSERT INTO objects (name, length, width, depth, surface, location) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [name, length, width, depth, surface, location], function (err) {
    if (err) {
      console.error('Error creating object:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID });
  });
});

app.put('/api/objects/:id', (req, res) => {
  const id = req.params.id;
  const { name, length, width, depth, surface, location } = req.body;
  if (!name || !length || !width || !depth || !surface || !location) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  const sql = 'UPDATE objects SET name = ?, length = ?, width = ?, depth = ?, surface = ?, location = ? WHERE id = ?';
  db.run(sql, [name, length, width, depth, surface, location, id], function (err) {
    if (err) {
      console.error('Error updating object:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    res.json({ message: 'Object updated' });
  });
});

app.delete('/api/objects/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM objects WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting object:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    res.json({ message: 'Object deleted' });
  });
});

// Serve frontend routes
app.get('/object/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'object-details.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});