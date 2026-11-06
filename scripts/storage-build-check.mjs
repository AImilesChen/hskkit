import {setTimeout as sleep} from 'node:timers/promises';

export async function waitForPublishedBuild(expected,{request=fetch,wait=sleep,attempts=15}={}) {
  if(!/^[A-Za-z0-9_-]{21}$/.test(expected)||!Number.isSafeInteger(attempts)||attempts<1||attempts>15)throw Error('INVALID_RELEASE_IDENTITY');
  let lastStatus=0;
  for(let attempt=0;attempt<attempts;attempt++){
    try {
      const response=await request('https://hskkit.com/BUILD_ID',{signal:AbortSignal.timeout(15000),redirect:'error',headers:{'Cache-Control':'no-cache','User-Agent':'HSKKit-Release-Verification/1.0'}});
      lastStatus=response.status;
      if(response.ok&&(await response.text()).trim()===expected)return;
    }catch{lastStatus=0;}
    if(attempt+1<attempts)await wait(3000);
  }
  throw Error(`LIVE_BUILD_MISMATCH_HTTP_${lastStatus}`);
}
