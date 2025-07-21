const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to check authentication
const requireAuth = async (req, res, next) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
};

// API routes
app.get('/api/objects', async (req, res) => {
  console.log('GET /api/objects');
  try {
    const { data, error } = await supabase.from('objects').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching objects:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/objects/:id', async (req, res) => {
  console.log(`GET /api/objects/${req.params.id}`);
  try {
    const { data, error } = await supabase.from('objects').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching object:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/objects', requireAuth, async (req, res) => {
  console.log('POST /api/objects', req.body);
  const { name, length, width, depth, surface, location } = req.body;
  if (!name || !length || !width || !depth || !surface || !location) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  try {
    const { data, error } = await supabase.from('objects').insert({
      name,
      length,
      width,
      depth,
      surface,
      location
    }).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating object:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/objects/:id', requireAuth, async (req, res) => {
  console.log(`PUT /api/objects/${req.params.id}`, req.body);
  const { name, length, width, depth, surface, location } = req.body;
  if (!name || !length || !width || !depth || !surface || !location) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  try {
    const { data, error } = await supabase.from('objects').update({
      name,
      length,
      width,
      depth,
      surface,
      location
    }).eq('id', req.params.id).select();
    if (error) throw error;
    if (!data.length) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating object:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/objects/:id', requireAuth, async (req, res) => {
  console.log(`DELETE /api/objects/${req.params.id}`);
  try {
    const { data, error } = await supabase.from('objects').delete().eq('id', req.params.id);
    if (error) throw error;
    if (!data.length) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    res.json({ message: 'Object deleted' });
  } catch (error) {
    console.error('Error deleting object:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend routes
app.get('/object/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'object-details.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
