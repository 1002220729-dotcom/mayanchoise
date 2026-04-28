const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function initDB(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_name TEXT NOT NULL,
      school_name TEXT NOT NULL,
      track_id TEXT NOT NULL,
      track_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    await initDB(env.DB);

    // GET /counts — ספירה לכל מגמה
    if (request.method === 'GET' && url.pathname === '/counts') {
      const rows = await env.DB.prepare(
        `SELECT track_id, track_name, COUNT(*) as count FROM registrations GROUP BY track_id`
      ).all();
      return json({ counts: rows.results });
    }

    // GET /report — דוח מלא לכל המגמות
    if (request.method === 'GET' && url.pathname === '/report') {
      const rows = await env.DB.prepare(
        `SELECT track_id, track_name, manager_name, school_name, created_at
         FROM registrations ORDER BY track_id, created_at`
      ).all();
      return json({ registrations: rows.results });
    }

    // POST /register — רישום חדש
    if (request.method === 'POST' && url.pathname === '/register') {
      let body;
      try { body = await request.json(); } catch {
        return json({ error: 'invalid JSON' }, 400);
      }

      const { manager_name, school_name, track_id, track_name } = body;
      if (!manager_name || !school_name || !track_id || !track_name) {
        return json({ error: 'missing fields' }, 400);
      }

      // בדיקת מגמה מלאה
      const { results: countRes } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM registrations WHERE track_id = ?`
      ).bind(track_id).all();

      if (countRes[0].count >= 5) {
        return json({ error: 'track_full' }, 409);
      }

      await env.DB.prepare(
        `INSERT INTO registrations (manager_name, school_name, track_id, track_name, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(manager_name, school_name, track_id, track_name, new Date().toISOString()).run();

      return json({ ok: true });
    }

    // DELETE /admin/reset — איפוס (להסיר בפרודקשן)
    if (request.method === 'DELETE' && url.pathname === '/admin/reset') {
      await env.DB.exec(`DELETE FROM registrations`);
      return json({ ok: true });
    }

    return json({ error: 'not found' }, 404);
  },
};
