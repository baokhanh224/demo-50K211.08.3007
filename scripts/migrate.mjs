import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// Prisma Migrate uses a session advisory lock. Neon transaction pooling is
// reserved for application traffic; use the same endpoint directly for CLI.
/** @param {Record<string, string | undefined>} [env] */
export function migrationDatabaseUrl(env = process.env) {
  const input = env.DIRECT_URL?.trim() || env.DATABASE_URL?.trim();
  if (!input) throw new Error('Cần cấu hình DATABASE_URL để khởi tạo CSDL');
  let url;
  try { url = new URL(input); } catch { throw new Error('DATABASE_URL không hợp lệ'); }
  if (!['postgresql:', 'postgres:'].includes(url.protocol))
    throw new Error('DATABASE_URL phải bắt đầu bằng postgresql:// hoặc postgres://');
  if (url.hostname.endsWith('.neon.tech')) {
    const parts = url.hostname.split('.');
    parts[0] = parts[0].replace(/-pooler$/, '');
    url.hostname = parts.join('.');
    url.searchParams.delete('pgbouncer');
  }
  return url.toString();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const require = createRequire(import.meta.url);
    const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: migrationDatabaseUrl() },
    });
    if (result.error) throw new Error('Không thể chạy Prisma Migrate');
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
