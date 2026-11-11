import {test} from 'node:test';
import assert from 'node:assert/strict';
import {migrationDatabaseUrl} from '../scripts/migrate.mjs';
test('Migration bypasses Neon transaction pool without changing runtime config',()=>{
 const env={DATABASE_URL:'postgresql://owner:test%40pw@ep-demo-pooler.c-2.ap-southeast-1.aws.neon.tech/demo?sslmode=require&pgbouncer=true'};
 const before=env.DATABASE_URL;
 const result=new URL(migrationDatabaseUrl(env));
 assert.equal(result.hostname,'ep-demo.c-2.ap-southeast-1.aws.neon.tech');
 assert.equal(result.searchParams.get('sslmode'),'require');
 assert.equal(result.searchParams.has('pgbouncer'),false);
 assert.equal(result.password,'test%40pw');
 assert.equal(result.pathname,'/demo');
 assert.equal(env.DATABASE_URL,before);
});
test('Migration respects direct override and local DB, rejects invalid URLs',()=>{
 const local='postgresql://owner:demo@localhost:5432/demo?schema=public';
 assert.equal(migrationDatabaseUrl({DATABASE_URL:local}),local);
 assert.equal(migrationDatabaseUrl({DATABASE_URL:local,DIRECT_URL:'postgresql://owner:demo@other.example/demo'}),'postgresql://owner:demo@other.example/demo');
 assert.throws(()=>migrationDatabaseUrl({}));
 assert.throws(()=>migrationDatabaseUrl({DATABASE_URL:'not-a-url'}));
 assert.throws(()=>migrationDatabaseUrl({DATABASE_URL:'https://example.com'}));
});
