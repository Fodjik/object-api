const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_ANON_KEY (or legacy SUPABASE_KEY).');
  process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function userClientFromToken(token) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getBearerAuth(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  const token = h.slice(7).trim();
  if (!token) return null;
  const {
    data: { user },
    error,
  } = await supabaseAnon.auth.getUser(token);
  if (error || !user) return null;
  return { user, token };
}

async function requireAuth(req, res, next) {
  const auth = await getBearerAuth(req);
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.auth = auth;
  req.sb = userClientFromToken(auth.token);
  next();
}

async function requireApproved(req, res, next) {
  const auth = await getBearerAuth(req);
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const sb = userClientFromToken(auth.token);
  const { data: profile, error } = await sb
    .from('profiles')
    .select('is_approved, is_admin, email')
    .eq('id', auth.user.id)
    .single();
  if (error || !profile) {
    res.status(403).json({ error: 'Profile not found' });
    return;
  }
  if (!profile.is_approved) {
    res.status(403).json({ error: 'Account pending approval' });
    return;
  }
  req.auth = auth;
  req.sb = sb;
  req.profile = profile;
  next();
}

async function requireAdmin(req, res, next) {
  const auth = await getBearerAuth(req);
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const sb = userClientFromToken(auth.token);
  const { data: profile, error } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .single();
  if (error || !profile?.is_admin) {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  req.auth = auth;
  next();
}

function assertServiceRole(res) {
  if (!supabaseAdmin) {
    res.status(503).json({
      error:
        'Set SUPABASE_SERVICE_ROLE_KEY on the server for public QR lookups and admin user deletion.',
    });
    return false;
  }
  return true;
}

/** Base URL users open in the browser (magic links must use this, not localhost by mistake). */
function getPublicSiteUrl(req) {
  const fromEnv = process.env.PUBLIC_SITE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim().replace(/\/$/, '');
  }
  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || 'http';
  if (!host) return '';
  return `${proto}://${host}`.replace(/\/$/, '');
}

// --- Public config (anon key is already public in client apps) ---
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl,
    supabaseAnonKey,
    publicSiteUrl: getPublicSiteUrl(req),
  });
});

// --- Public object (QR / share link; UUID only) ---
app.get('/api/public/objects/:id', async (req, res) => {
  if (!assertServiceRole(res)) return;
  const { id } = req.params;
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('objects')
      .select(
        `id, name, length, width, depth, surface,
         locations ( name ),
         materials ( name, description )`
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    const loc = data.locations;
    const mat = data.materials;
    res.json({
      id: data.id,
      name: data.name,
      length: data.length,
      width: data.width,
      depth: data.depth,
      surface: data.surface,
      location_name: loc?.name ?? null,
      material_name: mat?.name ?? null,
      material_description: mat?.description ?? '',
    });
  } catch (e) {
    console.error('public object:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// --- Profile (any signed-in user) ---
app.get('/api/profiles/me', requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('profiles')
      .select('email, is_approved, is_admin')
      .eq('id', req.auth.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Locations ---
app.get('/api/locations', requireApproved, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('locations')
      .select('id, name, created_at')
      .order('name');
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/locations', requireApproved, async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  try {
    const { data, error } = await req.sb
      .from('locations')
      .insert({ user_id: req.auth.user.id, name })
      .select('id, name, created_at')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/locations/:id', requireApproved, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('locations')
      .delete()
      .eq('id', req.params.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Materials ---
app.get('/api/materials', requireApproved, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('materials')
      .select('id, name, description, created_at')
      .order('name');
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/materials', requireApproved, async (req, res) => {
  const name = (req.body.name || '').trim();
  const description = (req.body.description || '').trim();
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  try {
    const { data, error } = await req.sb
      .from('materials')
      .insert({
        user_id: req.auth.user.id,
        name,
        description,
      })
      .select('id, name, description, created_at')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/materials/:id', requireApproved, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('materials')
      .delete()
      .eq('id', req.params.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const objectSelect =
  'id, name, length, width, depth, surface, location_id, material_id, created_at, locations(name), materials(name, description)';

function mapObjectRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    length: row.length,
    width: row.width,
    depth: row.depth,
    surface: row.surface,
    location_id: row.location_id,
    material_id: row.material_id,
    created_at: row.created_at,
    location_name: row.locations?.name ?? null,
    material_name: row.materials?.name ?? null,
    material_description: row.materials?.description ?? '',
  };
}

// --- Objects ---
app.get('/api/objects', requireApproved, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('objects')
      .select(objectSelect)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(mapObjectRow));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/objects/:id', requireApproved, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('objects')
      .select(objectSelect)
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    res.json(mapObjectRow(data));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/objects', requireApproved, async (req, res) => {
  const { name, length, width, depth, surface, location_id, material_id } =
    req.body;
  if (
    !name ||
    length === undefined ||
    width === undefined ||
    depth === undefined ||
    !surface ||
    !location_id ||
    !material_id
  ) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  try {
    const { data, error } = await req.sb
      .from('objects')
      .insert({
        user_id: req.auth.user.id,
        name,
        length: Number(length),
        width: Number(width),
        depth: Number(depth),
        surface,
        location_id,
        material_id,
      })
      .select(objectSelect)
      .single();
    if (error) throw error;
    res.status(201).json(mapObjectRow(data));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/objects/:id', requireApproved, async (req, res) => {
  const { name, length, width, depth, surface, location_id, material_id } =
    req.body;
  if (
    !name ||
    length === undefined ||
    width === undefined ||
    depth === undefined ||
    !surface ||
    !location_id ||
    !material_id
  ) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }
  try {
    const { data, error } = await req.sb
      .from('objects')
      .update({
        name,
        length: Number(length),
        width: Number(width),
        depth: Number(depth),
        surface,
        location_id,
        material_id,
      })
      .eq('id', req.params.id)
      .select(objectSelect);
    if (error) throw error;
    if (!data?.length) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    res.json(mapObjectRow(data[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/objects/:id', requireApproved, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('objects')
      .delete()
      .eq('id', req.params.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    res.json({ message: 'Object deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin (service role) ---
app.get('/api/users', requireAdmin, async (_req, res) => {
  if (!assertServiceRole(res)) return;
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, is_approved, is_admin, created_at')
      .order('created_at');
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users/approve/:id', requireAdmin, async (req, res) => {
  if (!assertServiceRole(res)) return;
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_approved: true })
      .eq('id', req.params.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'Approved' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users/make-admin/:id', requireAdmin, async (req, res) => {
  if (!assertServiceRole(res)) return;
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', req.params.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'Updated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (id === req.auth.user.id) {
    res.status(400).json({ error: 'Cannot delete yourself' });
    return;
  }
  if (!assertServiceRole(res)) return;
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- HTML pages (live outside /public) ---
app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/register', (_req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/auth/callback', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth-callback.html'));
});

app.get('/object/:id', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'object-details.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
