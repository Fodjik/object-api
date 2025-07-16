const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Serve static frontend
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoints
app.get('/objects', async (req, res) => {
  const { data, error } = await supabase.from('objects').select('*');
  res.json({ data, error });
});

app.post('/objects', async (req, res) => {
  console.log('Received:', req.body);
  const { data, error } = await supabase.from('objects').insert([req.body]);
  res.json({ data, error });
});

app.put('/objects/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('objects')
    .update(req.body)
    .eq('id', req.params.id);
  res.json({ data, error });
});

app.delete('/objects/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('objects')
    .delete()
    .eq('id', req.params.id);
  res.json({ data, error });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
