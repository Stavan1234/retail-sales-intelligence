# Deploying for free on Vercel

The whole project (website and Python analytics API) deploys as **one Vercel project** on the free Hobby plan. You need one website address, one account, and no environment variables.

## How it fits together

`vercel.json` in the project root defines two **services** that share one domain:

| Service | Folder | What it is | Public path |
|---|---|---|---|
| `web` | `.` (project root) | Next.js website | everything else (`/`, `/overview`, …) |
| `api` | `backend/` | FastAPI analytics (pandas, SciPy, scikit-learn, statsmodels) | `/api/...` |

```text
Browser ──► your-app.vercel.app/overview  ──► web (Next.js)
Browser ──► your-app.vercel.app/api/...   ──► api (FastAPI)
```

Both run on the same domain, so the website simply calls `/api/...`. There are no addresses to copy between services and no CORS settings.

The `api` service is built from the `backend/` folder only, so it carries its own copy of the dataset in `backend/data/`. A test (`backend/tests/test_deployment_bundle.py`) checks that this copy is identical to `data/source/`.

---

## Step 1: Put the project on GitHub

The project is already a git repository with its first commit.

1. On github.com, create a new **empty** repository called `retail-sales-intelligence`. Don't add a README.
2. In the project folder, run these two commands. Replace `YOUR-NAME` with your GitHub username.

```bash
git remote add origin https://github.com/YOUR-NAME/retail-sales-intelligence.git
```

```bash
git push -u origin main
```

## Step 2: Import it into Vercel

1. Go to **vercel.com** and sign in with GitHub.
2. Click **Add New → Project** and **Import** your repository.
3. Vercel reads `vercel.json` and shows the two services (`web` and `api`). **Don't change any settings and don't add environment variables.**
4. Click **Deploy** and wait a few minutes. The Python libraries take the longest to install.
5. Open the address Vercel gives you, for example `https://retail-sales-intelligence.vercel.app`.

To check it worked:
- `https://<your-address>/api/health` should show `"status":"ok"` and `"rows":10194`.
- The sidebar should say **"Connected to the analytics API"**.

That's all. Every later `git push` redeploys automatically.

---

## Good to know

- **First load can be slow.** When nobody has used the site for a while, the first request starts the Python function from cold, which can take several seconds. Open the site a minute before presenting.
- **Size.** The Python libraries are about 430 MB, under Vercel's 500 MB limit for Python functions. Don't add large new packages to `backend/pyproject.toml`.
- **Dependencies.** Vercel installs the `api` service's packages from `backend/pyproject.toml`. If you change a version there, change it in `backend/requirements.txt` too, because `setup.bat` and `run.bat` use that file.
- **Local use is unchanged.** `run.bat` still runs everything on your computer. It uses `.env.local` to point the website at the API on port 8000.

## If something doesn't work

| What you see | What to do |
|---|---|
| Build fails in the `api` service with a size error | Check that no large packages were added to `backend/pyproject.toml`. If it still fails, use the backup option below. |
| `/api/health` returns 404 | Make sure `vercel.json` is in the repository root and was pushed. Then redeploy. |
| The site loads but the sidebar says "Analytics API not reachable" | Wait a few seconds and refresh (cold start). If it persists, open `/api/health` and check the `api` service's logs in the Vercel dashboard. |
| You set `NEXT_PUBLIC_API_BASE_URL` in Vercel by mistake | Delete it and redeploy. On Vercel it must be empty, so the site calls its own `/api`. |

## Backup option: API on Render

If the `api` service can't run on Vercel (for example, if the size limit changes), the API can be hosted separately on Render's free plan using `render.yaml`:

1. On render.com, choose **New → Blueprint**, select the repository, and set `FRONTEND_ORIGINS` to your Vercel address.
2. In Vercel, add the environment variable `NEXT_PUBLIC_API_BASE_URL` with the Render address.
3. Remove the `api` service and the `/api` rewrite from `vercel.json`.

Only use this if the main approach fails.
