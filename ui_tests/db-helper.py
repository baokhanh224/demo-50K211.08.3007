"""Read-only test helper, never exposed as an HTTP API."""

import sys, json, os
from urllib.parse import urlsplit
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from quynh_nhu.db import database, all

if not urlsplit(os.environ.get("PYTHON_DATABASE_URL", "")).path.endswith("_test"):
    raise RuntimeError("Only a disposable _test database is allowed")
query = sys.argv[1]
if not query.lstrip().upper().startswith("SELECT "):
    raise RuntimeError("Read-only helper")
with database():
    print(json.dumps(all(query), ensure_ascii=False))
