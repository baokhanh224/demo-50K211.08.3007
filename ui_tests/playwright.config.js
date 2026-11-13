import {defineConfig} from '../frontend/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
export default defineConfig({testDir:'.',testMatch:'*.spec.js',workers:1,timeout:120000,expect:{timeout:15000},use:{baseURL:process.env.BASE_URL||'http://localhost:8100',viewport:{width:1440,height:927},headless:true,launchOptions:{executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']},screenshot:'only-on-failure'},outputDir:'../python-evidence/browser',reporter:'list'});
