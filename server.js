const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/objects', async (req, res) => {
  const { data, error } = await supabase.from('objects').select('*');
  res.json({ data, error });
});

app.post('/objects', async (req, res) => {
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

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running...');
});
