import type { BrowserContext } from '@playwright/test';
// The Cloud Chromium store lacks the proxy CA. Node uses the supplied CA;
// keep full TLS validation and forward actual server responses, without mocks.
export async function installTrustedTransport(context: BrowserContext) {
 const origin=new URL(process.env.BASE_URL || '').origin;
 await context.route(origin+'/**',async route=>{
  const req=route.request(), headers=await req.allHeaders();
  delete headers.host;delete headers['content-length'];
  const body=req.postDataBuffer();
  const r=await fetch(req.url(),{method:req.method(),headers,body:body?new Uint8Array(body).buffer:undefined,redirect:'manual'});
  const output:Record<string,string>=Object.fromEntries(r.headers);
  delete output['content-encoding'];delete output['content-length'];
  const cookies=r.headers.getSetCookie();if(cookies.length)output['set-cookie']=cookies.join('\n');
  await route.fulfill({status:r.status,headers:output,body:Buffer.from(await r.arrayBuffer())});
 });
}
