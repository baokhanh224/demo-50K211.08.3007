# Quỳnh Như — Python edition

- Backend and production server: Python 3.12, FastAPI, psycopg/PostgreSQL.
- Preserve `frontend/` markup, CSS, messages and Figma assets. Browser UI uses React JavaScript; Node is a build tool only.
- Run `npm ci --prefix frontend` then `npm run build --prefix frontend` after frontend changes. Commit `static/build/` so runtime needs only Python.
- Never run seed against the live database. Use a separate database ending in `_test` for business/UI tests.
- Multi-table writes require transactions. Preserve idempotency, row locks, FEFO and original source allocations.
- Do not migrate/seed at import, startup or deploy. Use explicit `python -m quynh_nhu.manage init` and seed commands.
- Business text comes from `docs/dac-ta-nghiep-vu-trich-xuat.txt`. Existing README decisions remain applicable.
- The old Next.js source is retained in Git history at `61a4402`; historical docs are explicitly marked.
