import test from "node:test";
import assert from "node:assert/strict";
import {anonymousAccountResponse} from "../src/lib/runtime/anonymous-account.ts";
test("Stateless account lookup preserves the existing anonymous response without caching it",async()=>{
 const r=anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account'))!;
 assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');
 assert.deepEqual(await r.json(),{account:null,connection:null,guest:{hasData:false,attempts:0,learningSessions:0,plannerVersions:0,revision:0}});
});
test("Every account, guest, arbitrary and malformed cookie goes through the original identity path",()=>{
 for(const cookie of ['hskkit_session=fixture','hskkit_account=fixture','hskkit_guest=fixture','consent=yes','malformed','%68skkit_session=fixture'])assert.equal(anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account',{headers:{cookie}})),undefined);
});
test("No-cookie rewards keep the existing unauthenticated status before parsing bodies",async()=>{
 for(const method of ['GET','POST']){const r=anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account/learning-rewards',{method,...(method==='POST'?{body:'invalid-json'}:{})}))!;assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'ACCOUNT_REQUIRED'});}
});
test("Login, paid files, state-changing account methods and blocked crawlers never use the fast path",()=>{
 for(const route of ['/api/v1/auth/google/start','/api/v1/course-tests/chinese-1/b/file/paper-data.json','/api/v1/account/','/api/v1/%61ccount'])assert.equal(anonymousAccountResponse(new Request('https://hskkit.com'+route)),undefined);
 for(const method of ['POST','PUT','DELETE','HEAD'])assert.equal(anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account',{method})),undefined);
 assert.equal(anonymousAccountResponse(new Request('https://hskkit.com/api/v1/account',{headers:{'user-agent':'MJ12bot/1.4'}})),undefined);
});
