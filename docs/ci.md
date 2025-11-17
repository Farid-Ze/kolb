# CI & Running Tests

This document explains how to run the Python backend tests locally and how the CI pipeline uses `PYTHONPATH` so your `app.*` imports resolve.

## Rationale
The repository uses `backend/app` on disk but many imports still use `import app.*`. To preserve runtime import semantics while keeping the repository tidy, set `PYTHONPATH` to the `backend` directory when running tests or starting the server.

## Local commands — Windows PowerShell
```powershell
# Install dependencies for backend
cd backend
py -3 -m pip install -r requirements.txt

# Set PYTHONPATH to the backend directory for the current session
$Env:PYTHONPATH = 'backend'

# Run tests
py -3 -m pytest -q

# Optional: run with coverage
py -3 -m pytest --cov=backend/app --cov-report=term-missing
```

Note: On Windows, use `$Env:PYTHONPATH` to set an environment variable in PowerShell.

## Local commands — Linux / macOS
```bash
# Install dependencies for backend
cd backend
python3 -m pip install -r requirements.txt

# Run tests with PYTHONPATH set just for the command
PYTHONPATH=backend pytest -q

# With coverage
PYTHONPATH=backend pytest --cov=backend/app --cov-report=term-missing
```

## GitHub Actions snippet (example)
Your backend CI should set the environment variable `PYTHONPATH: backend` before running tests. Example steps in `.github/workflows/backend-ci.yml`:

```yaml
- name: Run tests
  run: |
    python -m pip install pytest
    pytest -q
  env:
    PYTHONPATH: backend
```

This repo already uses `PYTHONPATH: backend` in CI steps for linting, mypy and test runs.

## Why we do this
- Keeps runtime imports compatible with `app.*` without renaming imports across code.
- CI and contributors do not need to refactor imports; just set `PYTHONPATH`.

## Troubleshooting
- If `import app` still fails locally, ensure you set `PYTHONPATH` to the **repo root** or `backend` depending on how you call tests. Usually `backend` is correct because it contains `app/` package.
- For GitHub Actions, set the env variable at the job or step-level (shown above).

## Additional tips
- For VS Code runs and debug configs, set the `env` section to include `PYTHONPATH: backend` so tests and debugging behave the same as CI.

```json
// .vscode/launch.json snippet for debugging
{
  "env": { "PYTHONPATH": "${workspaceFolder}/backend" }
}
```
