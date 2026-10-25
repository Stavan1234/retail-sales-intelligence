# HTTPX2 / Starlette TestClient Fix

The current Starlette 1.7.x `TestClient` uses `httpx2`. It is optional for the Starlette runtime but required when this project's tests import `fastapi.testclient.TestClient`.

Pinned test-client stack for this project:

- `httpx2==2.13.1`
- `httpcore2==2.13.1`
- `truststore==0.10.4`

The project installs from `backend/requirements-lock.txt`, so the packages are pinned there as well as in `backend/requirements.txt`.

`scripts/verify_python_environment.py` checks `httpx2` explicitly so a future missing TestClient dependency fails at the environment gate with a useful message rather than during pytest collection.
