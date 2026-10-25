# Deploying for free

The project has two parts, and each goes to a free service that suits it:

| Part | What it is | Where | Why there |
|---|---|---|---|
| Website | Next.js (the pages you see) | **Vercel** (free Hobby plan) | Made by the creators of Next.js, so it works with no extra setup. |
| Analytics API | FastAPI + pandas, SciPy, scikit-learn, statsmodels | **Render** (free web service) | These Python libraries are too large for Vercel's free serverless functions. Render runs a normal Python server. |

```text
Visitor's browser ──► Vercel (website) ──► Render (analytics API, reads data/ from the repo)
```

**One thing to know about the free Render plan:** the API goes to sleep after about 15 minutes with no visitors. The first visit after that takes **30–60 seconds** while it wakes up, and the site shows "Connecting…" during that time. Before presenting, open the site a couple of minutes early to wake it up.

You need three free accounts: **GitHub**, **Render** and **Vercel**. You can sign in to Render and Vercel with your GitHub account.

---

## Step 1: Put the project on GitHub

Both Render and Vercel deploy straight from a GitHub repository.

1. Create a new **empty** repository on github.com, for example `retail-sales-intelligence`. Don't add a README or a .gitignore there.
2. In a terminal in the project folder, run these commands. Replace `YOUR-NAME` with your GitHub username.

```bash
git init
git add .
git commit -m "Retail Sales Intelligence: initial version"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/retail-sales-intelligence.git
git push -u origin main
```

The `.gitignore` already keeps out `node_modules`, `.next`, the Python virtual environment and the `.env` files, so only the source code and the dataset are uploaded.

If you prefer clicking to typing, **GitHub Desktop** does the same thing: *File → Add local repository → Publish repository*.

---

## Step 2: Deploy the API on Render

1. Go to **render.com** and sign in with GitHub.
2. Click **New → Blueprint** and pick your repository. Render reads the `render.yaml` file in the project, which already sets:
   - build: `pip install -r backend/requirements.txt`
   - start: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - Python 3.13.5 and the free plan
3. Render asks for a value for **`FRONTEND_ORIGINS`**. For now, enter `http://localhost:3000`. You'll replace it with your Vercel address in Step 4.
4. Click **Apply**. The first build takes a few minutes.
5. When it shows **Live**, copy the address, for example `https://retail-sales-intelligence-api.onrender.com`.
6. Check it works: open `https://<your-render-address>/api/health` in a browser. You should see `"status":"ok"` and `"rows":10194`.

---

## Step 3: Deploy the website on Vercel

1. Go to **vercel.com** and sign in with GitHub.
2. Click **Add New → Project** and import your repository. Vercel detects **Next.js** automatically. Leave the build settings as they are.
3. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_API_BASE_URL` | your Render address from Step 2, e.g. `https://retail-sales-intelligence-api.onrender.com` (no `/` at the end) |

4. Click **Deploy**. When it finishes, copy your site address, for example `https://retail-sales-intelligence.vercel.app`.

If the build fails with a Node.js version message, open *Project → Settings → General → Node.js Version*, choose **24.x**, and redeploy. The project requires Node 24.

---

## Step 4: Connect the two

The API only answers requests from websites it trusts, as a security measure. Tell it about your Vercel address:

1. In Render, open your service → **Environment** → edit `FRONTEND_ORIGINS`.
2. Set it to your Vercel address. Keep localhost too, so `run.bat` still works:

   ```text
   https://retail-sales-intelligence.vercel.app,http://localhost:3000
   ```

3. Save. Render restarts the API automatically.
4. Open your Vercel address. The sidebar should say **"Connected to the analytics API"** and the pages should fill with data.

---

## Updating the site later

Commit and push your changes:

```bash
git add .
git commit -m "Describe what you changed"
git push
```

Vercel and Render both redeploy automatically within a few minutes.

## If something doesn't work

| What you see | What to do |
|---|---|
| Sidebar says "Analytics API not reachable" | Wait one minute (the free server is waking up) and refresh. If it persists, open `<render-address>/api/health` to check the API is live. |
| Browser console shows a **CORS** error | `FRONTEND_ORIGINS` on Render does not exactly match your Vercel address. Check `https://`, the spelling, and that there's no trailing `/`. |
| Pages still try to call `127.0.0.1:8000` | `NEXT_PUBLIC_API_BASE_URL` was missing when Vercel built the site. Add it, then **Redeploy** (the value is baked in at build time). |
| Render build fails while installing packages | Check that `PYTHON_VERSION` is `3.13.5` in the Render environment. |
