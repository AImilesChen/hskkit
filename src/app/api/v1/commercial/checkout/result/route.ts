import {NextRequest,NextResponse} from "next/server";
import {requestIdentity} from "@/lib/account/identity";
import {digitalCheckoutResultForUser} from "@/lib/commercial/digital-storage";
import {packCheckoutResultForUser} from "@/lib/commercial/storage";
export async function GET(req:NextRequest){const identity=await requestIdentity();if(!identity.account||identity.account.status!=="active")return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});const sessionId=req.nextUrl.searchParams.get("session_id")??"";if(!sessionId.startsWith("cs_test_")||sessionId.length>255)return NextResponse.json({error:"INVALID_SESSION_ID"},{status:422});const digital=await digitalCheckoutResultForUser(sessionId,identity.account.userId);const result=digital??await packCheckoutResultForUser(sessionId,identity.account.userId);if(!result)return NextResponse.json({error:"ORDER_NOT_FOUND"},{status:404});return NextResponse.json(result,{headers:{"cache-control":"private, no-store"}});}
