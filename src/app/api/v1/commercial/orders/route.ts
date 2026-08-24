import { NextResponse } from "next/server";
import { requestIdentity } from "@/lib/account/identity";
import { listPackOrders } from "@/lib/commercial/storage";
export async function GET(){const identity=await requestIdentity();if(!identity.account||identity.account.status!=="active")return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});return NextResponse.json({orders:await listPackOrders(identity.account.userId)},{headers:{"cache-control":"private, no-store"}});}
