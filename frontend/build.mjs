import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
await build({absWorkingDir:dir,entryPoints:['main.jsx'],bundle:true,external:['/figma/*','/fonts/*'],jsx:'automatic',format:'esm',target:'es2022',outdir:'../static/build',entryNames:'app',assetNames:'assets/[name]-[hash]',loader:{'.woff2':'file','.woff':'file'},minify:true,define:{'process.env.NODE_ENV':'"production"'}});
