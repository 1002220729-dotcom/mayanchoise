# 🎓 מגמות למנהלים — הוראות Deploy

## מה יש כאן
- `site/index.html` — האתר המלא (רישום + דוח)
- `worker/index.js` — Cloudflare Worker (API)
- `worker/wrangler.toml` — הגדרות Worker

---

## שלב 1 — הכנת Cloudflare Worker

### התקנת Wrangler (כלי ה-CLI של Cloudflare)
```bash
npm install -g wrangler
wrangler login
```

### יצירת מסד נתונים D1
```bash
cd worker
wrangler d1 create tracks-db
```
העתק את `database_id` שמופיע בפלט ⬆ והדבק ב-`wrangler.toml`:
```toml
database_id = "PASTE-YOUR-ID-HERE"
```

### העלאת ה-Worker
```bash
wrangler deploy
```

לאחר ה-deploy תקבל כתובת כמו:
`https://tracks-worker.YOUR-SUBDOMAIN.workers.dev`

---

## שלב 2 — עדכון כתובת ה-API באתר

פתח `site/index.html` ושנה בשורה:
```js
const API = 'https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev';
```
לכתובת שקיבלת בשלב 1.

---

## שלב 3 — העלאה ל-GitHub Pages

1. צור ריפו חדש ב-GitHub (לדוגמה: `tracks-app`)
2. העלה את תיקיית `site/`:
```bash
cd site
git init
git add .
git commit -m "first deploy"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/tracks-app.git
git push -u origin main
```
3. ב-GitHub → Settings → Pages → Source: **main branch / root**
4. האתר יהיה זמין בכתובת:
   `https://YOUR-USERNAME.github.io/tracks-app/`

---

## נקודות API

| Method | Path | תיאור |
|--------|------|--------|
| `GET` | `/counts` | ספירת נרשמים לכל מגמה |
| `GET` | `/report` | כל הרישומים המלאים |
| `POST` | `/register` | רישום מנהל חדש |
| `DELETE` | `/admin/reset` | **מחיקת כל הנתונים** (להסיר בסוף!) |

### דוגמה ל-POST /register
```json
{
  "manager_name": "רחל לוי",
  "school_name": "בית ספר אמית",
  "track_id": "english",
  "track_name": "אנגלית בטעמים"
}
```

---

## הגדרות
- **מגמות**: ניתן לערוך את `TRACKS` ב-`site/index.html` וב-`worker/index.js` (אם רוצים validation בצד השרת)
- **מקסימום לכל מגמה**: שנה `MAX = 5` ב-`site/index.html` ו-`>= 5` ב-`worker/index.js`
- **Polling**: האתר מתרענן אוטומטית כל 10 שניות

---

## לאחר האירוע
הסר את endpoint ה-`DELETE /admin/reset` מ-`worker/index.js` לפני שמפיצים לציבור.
