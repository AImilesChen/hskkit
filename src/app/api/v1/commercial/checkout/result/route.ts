import {NextRequest,NextResponse} from "next/server";
import {getCloudflareContext} from "@opennextjs/cloudflare";
import {requestIdentity} from "@/lib/account/identity";
import {subscriptionCommercePolicy} from "@/lib/commercial/domain";
import {digitalCheckoutResultForUser} from "@/lib/commercial/digital-storage";
import {packCheckoutResultForUser} from "@/lib/commercial/storage";
export async function GET(req:NextRequest){const identity=await requestIdentity();if(!identity.account||identity.account.status!=="active")return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});const env=(await getCloudflareContext({async:true})).env;const policy=subscriptionCommercePolicy(env);if(!policy.enabled)return NextResponse.json({error:"COMMERCE_NOT_CONFIGURED"},{status:503});const sessionId=req.nextUrl.searchParams.get("session_id")??"";const prefix=policy.mode==="live"?"cs_live_":"cs_test_";if(!sessionId.startsWith(prefix)||sessionId.length>255)return NextResponse.json({error:"INVALID_SESSION_ID"},{status:422});const digital=await digitalCheckoutResultForUser(sessionId,identity.account.userId);const result=digital??(policy.mode==="test"?await packCheckoutResultForUser(sessionId,identity.account.userId):null);if(!result)return NextResponse.json({error:"ORDER_NOT_FOUND"},{status:404});return NextResponse.json(result,{headers:{"cache-control":"private, no-store"}});}
