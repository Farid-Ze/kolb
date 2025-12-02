import sys
import os
import shutil
import subprocess
import filecmp
import tempfile
from pathlib import Path

# Constants
BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = REPO_ROOT / "frontend"
GENERATED_TYPES_DIR = FRONTEND_DIR / "src" / "shared" / "api" / "generated"

def run_command(command, cwd=None, env=None, shell=False):
    """Run a shell command and return its output."""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            env=env,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=shell
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        raise

def generate_openapi_spec(output_path):
    """Generate openapi.json from backend."""
    print("Generating OpenAPI spec...")
    
    env = os.environ.copy()
    env["PYTHONPATH"] = str(BACKEND_DIR)
    
    scripts_dir = BACKEND_DIR / "scripts"
    # Use sys.executable to ensure we use the same python interpreter
    run_command([sys.executable, "dump_openapi.py"], cwd=scripts_dir, env=env)
    
    src = scripts_dir / "openapi.json"
    if not src.exists():
        # Fallback: check if it was written to CWD (repo root) if cwd arg failed
        src_root = Path.cwd() / "openapi.json"
        if src_root.exists():
            src = src_root
        else:
            raise FileNotFoundError(f"openapi.json was not generated in {scripts_dir}")
    
    shutil.move(str(src), output_path)
    print(f"OpenAPI spec generated at {output_path}")

def generate_client(spec_path, output_dir):
    """Generate typescript client from spec."""
    print("Generating frontend client...")
    
    # Use relative paths from frontend dir
    # spec_path and output_dir should be relative to FRONTEND_DIR or absolute
    # But to match manual success, let's use relative if they are inside frontend dir
    
    try:
        rel_spec = spec_path.relative_to(FRONTEND_DIR)
        rel_output = output_dir.relative_to(FRONTEND_DIR)
    except ValueError:
        # Fallback to absolute if not in frontend dir (should not happen with new logic)
        rel_spec = spec_path
        rel_output = output_dir

    # Use npx.cmd for Windows explicitly if possible, or just npx with shell=True
    npx = "npx.cmd" if os.name == "nt" else "npx"
    
    cmd = [npx, "openapi-typescript-codegen", "--input", str(rel_spec), "--output", str(rel_output), "--client", "axios"]
    run_command(cmd, cwd=FRONTEND_DIR, shell=False)
    print(f"Client generated at {output_dir}")

def _compare_dircmp(dcmp):
    """Recursive helper for directory comparison."""
    if dcmp.left_only or dcmp.right_only or dcmp.diff_files or dcmp.funny_files:
        return False
    for sub_dcmp in dcmp.subdirs.values():
        if not _compare_dircmp(sub_dcmp):
            return False
    return True

def compare_directories(dir1, dir2):
    """
    Compare two directories recursively.
    Returns True if they are identical, False otherwise.
    """
    dcmp = filecmp.dircmp(dir1, dir2)
    return _compare_dircmp(dcmp)

def main():
    print("Starting OpenAPI Sync Check...")
    
    # Use a temp dir inside frontend to avoid path issues
    temp_dir_name = ".temp_sync_check"
    temp_path = FRONTEND_DIR / temp_dir_name
    
    if temp_path.exists():
        shutil.rmtree(temp_path)
    temp_path.mkdir()
    
    try:
        spec_path = temp_path / "openapi.json"
        client_output_dir = temp_path / "generated_client"
        
        generate_openapi_spec(spec_path)
        generate_client(spec_path, client_output_dir)
        
        print("Comparing with existing generated types...")
        if not GENERATED_TYPES_DIR.exists():
            print(f"Existing generated directory not found at {GENERATED_TYPES_DIR}")
            sys.exit(1)
            
        if compare_directories(client_output_dir, GENERATED_TYPES_DIR):
            print("✅ Success: Frontend types are in sync with Backend schema.")
            sys.exit(0)
        else:
            print("❌ Failure: Frontend types are out of sync.")
            print("Run 'npm run generate-client' in frontend/ to update.")
            sys.exit(1)
            
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
    finally:
        if temp_path.exists():
            shutil.rmtree(temp_path)
