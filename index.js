const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS,
    },
  });
}

async function initDB(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_name TEXT NOT NULL,
      school_name TEXT NOT NULL,
      track_id TEXT NOT NULL,
      track_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `).run();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS,
      });
    }

    await initDB(env.DB);

    if (request.method === 'GET' && url.pathname === '/counts') {
      const rows = await env.DB.prepare(`
        SELECT track_id, track_name, COUNT(*) AS count
        FROM registrations
        GROUP BY track_id, track_name
      `).all();

      return json({ counts: rows.results || [] });
    }

    if (request.method === 'GET' && url.pathname === '/report') {
      const rows = await env.DB.prepare(`
        SELECT track_id, track_name, manager_name, school_name, created_at
        FROM registrations
        ORDER BY track_id ASC, created_at ASC
      `).all();

      return json({ registrations: rows.results || [] });
    }

    if (request.method === 'POST' && url.pathname === '/register') {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({ error: 'invalid JSON' }, 400);
      }

      const { manager_name, school_name, track_id, track_name } = body || {};

      if (!manager_name || !school_name || !track_id || !track_name) {
        return json({ error: 'missing fields' }, 400);
      }

      const countRow = await env.DB.prepare(`
        SELECT COUNT(*) AS count
        FROM registrations
        WHERE track_id = ?
      `).bind(track_id).first();

      if (Number(countRow?.count || 0) >= 5) {
        return json({ error: 'track_full' }, 409);
      }

      await env.DB.prepare(`
        INSERT INTO registrations (
          manager_name,
          school_name,
          track_id,
          track_name,
          created_at
        )
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        manager_name.trim(),
        school_name.trim(),
        track_id,
        track_name,
        new Date().toISOString()
      ).run();

      return json({ ok: true });
    }

    if (request.method === 'DELETE' && url.pathname === '/admin/reset') {
      await env.DB.prepare(`DELETE FROM registrations`).run();
      return json({ ok: true });
    }

    return json({ error: 'not found' }, 404);
  },
};