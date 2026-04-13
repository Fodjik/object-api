const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
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
    .select('is_approved, is_admin, email, can_edit_objects')
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

function requireCanEdit(req, res, next) {
  if (req.profile?.is_admin || req.profile?.can_edit_objects) {
    next();
    return;
  }
  res.status(403).json({ error: 'View only: your account cannot create or edit data' });
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

async function actorEmailsFor(ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (!unique.length || !supabaseAdmin) return {};
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .in('id', unique);
  const map = {};
  (data || []).forEach((r) => {
    map[r.id] = r.email || '';
  });
  return map;
}

app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl,
    supabaseAnonKey,
  });
});

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
        `id, name, length, width, depth, surface, description, created_at, updated_at,
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
    const { data: changelog } = await supabaseAdmin
      .from('object_changelog')
      .select('action, at')
      .eq('object_id', id)
      .order('at', { ascending: true });

    const loc = data.locations;
    const mat = data.materials;
    res.json({
      id: data.id,
      name: data.name,
      length: data.length,
      width: data.width,
      depth: data.depth,
      surface: data.surface,
      description: data.description ?? '',
      location_name: loc?.name ?? null,
      material_name: mat?.name ?? null,
      material_description: mat?.description ?? '',
      created_at: data.created_at,
      updated_at: data.updated_at,
      changelog: changelog || [],
    });
  } catch (e) {
    console.error('public object:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/profiles/me', requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('profiles')
      .select('email, is_approved, is_admin, can_edit_objects')
      .eq('id', req.auth.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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

app.post('/api/locations', requireApproved, requireCanEdit, async (req, res) => {
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

app.delete('/api/locations/:id', requireApproved, requireCanEdit, async (req, res) => {
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

app.post('/api/materials', requireApproved, requireCanEdit, async (req, res) => {
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

app.delete('/api/materials/:id', requireApproved, requireCanEdit, async (req, res) => {
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
  'id, name, length, width, depth, surface, description, price, location_id, material_id, created_at, updated_at, created_by, updated_by, locations(name), materials(name, description)';

function mapObjectListRow(row, isAdmin) {
  if (!row) return null;
  const o = {
    id: row.id,
    name: row.name,
    length: row.length,
    width: row.width,
    depth: row.depth,
    surface: row.surface,
    description: row.description ?? '',
    location_id: row.location_id,
    material_id: row.material_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    location_name: row.locations?.name ?? null,
    material_name: row.materials?.name ?? null,
    material_description: row.materials?.description ?? '',
  };
  if (isAdmin && row.price != null) {
    o.price = row.price;
  }
  return o;
}

async function appendChangelog(sb, objectId, actorId, action) {
  await sb.from('object_changelog').insert({
    object_id: objectId,
    actor_id: actorId,
    action,
  });
}

async function loadChangelogDetail(sb, objectId) {
  const { data, error } = await sb
    .from('object_changelog')
    .select('id, action, at, actor_id')
    .eq('object_id', objectId)
    .order('at', { ascending: true });
  if (error) throw error;
  const emails = await actorEmailsFor((data || []).map((r) => r.actor_id));
  return (data || []).map((r) => ({
    id: r.id,
    action: r.action,
    at: r.at,
    actor_email: emails[r.actor_id] || null,
  }));
}

async function loadCreatorEditors(sb, createdBy, updatedBy) {
  const emails = await actorEmailsFor([createdBy, updatedBy]);
  return {
    created_by_email: createdBy ? emails[createdBy] || null : null,
    updated_by_email: updatedBy ? emails[updatedBy] || null : null,
  };
}

function parsePriceForCreate(body, isAdmin) {
  if (!isAdmin) return { price: null };
  if (body.price === undefined || body.price === null || body.price === '') {
    return { price: null };
  }
  const n = Number(body.price);
  if (Number.isNaN(n)) {
    return { error: 'Invalid price' };
  }
  return { price: n };
}

function parsePriceForUpdate(body, isAdmin) {
  if (!isAdmin || !Object.prototype.hasOwnProperty.call(body, 'price')) {
    return { use: false };
  }
  if (body.price === null || body.price === '') {
    return { use: true, price: null };
  }
  const n = Number(body.price);
  if (Number.isNaN(n)) {
    return { error: 'Invalid price' };
  }
  return { use: true, price: n };
}

app.get('/api/objects', requireApproved, async (req, res) => {
  try {
    const { data, error } = await req.sb
      .from('objects')
      .select(objectSelect)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const isAdmin = !!req.profile.is_admin;
    res.json((data || []).map((r) => mapObjectListRow(r, isAdmin)));
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
    const isAdmin = !!req.profile.is_admin;
    const base = mapObjectListRow(data, isAdmin);
    const [changelog, names] = await Promise.all([
      loadChangelogDetail(req.sb, data.id),
      loadCreatorEditors(req.sb, data.created_by, data.updated_by),
    ]);
    res.json({
      ...base,
      changelog,
      ...names,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/objects', requireApproved, requireCanEdit, async (req, res) => {
  const {
    name,
    length,
    width,
    depth,
    surface,
    location_id,
    material_id,
    description,
  } = req.body;
  if (
    !name ||
    length === undefined ||
    width === undefined ||
    depth === undefined ||
    !surface ||
    !location_id ||
    !material_id
  ) {
    res.status(400).json({ error: 'Name, dimensions, surface, location and material are required' });
    return;
  }
  const pr = parsePriceForCreate(req.body, req.profile.is_admin);
  if (pr.error) {
    res.status(400).json({ error: pr.error });
    return;
  }
  const uid = req.auth.user.id;
  const now = new Date().toISOString();
  try {
    const insertRow = {
      user_id: uid,
      name,
      length: Number(length),
      width: Number(width),
      depth: Number(depth),
      surface,
      description: (description || '').trim(),
      location_id,
      material_id,
      created_by: uid,
      updated_by: uid,
      updated_at: now,
    };
    if (req.profile.is_admin) {
      insertRow.price = pr.price;
    }
    const { data, error } = await req.sb
      .from('objects')
      .insert(insertRow)
      .select(objectSelect)
      .single();
    if (error) throw error;
    await appendChangelog(req.sb, data.id, uid, 'create');
    const isAdmin = !!req.profile.is_admin;
    res.status(201).json({
      ...mapObjectListRow(data, isAdmin),
      changelog: await loadChangelogDetail(req.sb, data.id),
      ...(await loadCreatorEditors(req.sb, data.created_by, data.updated_by)),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/objects/:id', requireApproved, requireCanEdit, async (req, res) => {
  const {
    name,
    length,
    width,
    depth,
    surface,
    location_id,
    material_id,
    description,
  } = req.body;
  if (
    !name ||
    length === undefined ||
    width === undefined ||
    depth === undefined ||
    !surface ||
    !location_id ||
    !material_id
  ) {
    res.status(400).json({ error: 'Name, dimensions, surface, location and material are required' });
    return;
  }
  const prUp = parsePriceForUpdate(req.body, req.profile.is_admin);
  if (prUp.error) {
    res.status(400).json({ error: prUp.error });
    return;
  }
  const uid = req.auth.user.id;
  const now = new Date().toISOString();
  try {
    const patch = {
      name,
      length: Number(length),
      width: Number(width),
      depth: Number(depth),
      surface,
      description: (description || '').trim(),
      location_id,
      material_id,
      updated_by: uid,
      updated_at: now,
    };
    if (prUp.use) {
      patch.price = prUp.price;
    }
    const { data, error } = await req.sb
      .from('objects')
      .update(patch)
      .eq('id', req.params.id)
      .select(objectSelect);
    if (error) throw error;
    if (!data?.length) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    const row = data[0];
    await appendChangelog(req.sb, row.id, uid, 'update');
    const isAdmin = !!req.profile.is_admin;
    res.json({
      ...mapObjectListRow(row, isAdmin),
      changelog: await loadChangelogDetail(req.sb, row.id),
      ...(await loadCreatorEditors(req.sb, row.created_by, row.updated_by)),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/objects/:id', requireApproved, requireCanEdit, async (req, res) => {
  const id = req.params.id;
  try {
    const { data, error } = await req.sb
      .from('objects')
      .delete()
      .eq('id', id)
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

app.get('/api/users', requireAdmin, async (_req, res) => {
  if (!assertServiceRole(res)) return;
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, is_approved, is_admin, can_edit_objects, created_at')
      .order('created_at');
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/inventory-total', requireAdmin, async (_req, res) => {
  if (!assertServiceRole(res)) return;
  try {
    const { data, error } = await supabaseAdmin
      .from('objects')
      .select('price');
    if (error) throw error;
    let total = 0;
    (data || []).forEach((r) => {
      const p = r.price != null ? Number(r.price) : 0;
      if (!Number.isNaN(p)) total += p;
    });
    res.json({ total, currency: 'unspecified' });
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

app.post('/api/users/can-edit/:id', requireAdmin, async (req, res) => {
  if (!assertServiceRole(res)) return;
  const canEdit = !!req.body.can_edit;
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ can_edit_objects: canEdit })
      .eq('id', req.params.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'Updated', can_edit_objects: canEdit });
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

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/register', (_req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
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
