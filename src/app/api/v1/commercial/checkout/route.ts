import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { requestIdentity } from "@/lib/account/identity";
import { commercialPolicy } from "@/lib/commercial/domain";
import { attachCheckoutSession, createPendingOrder, markOrderFailed } from "@/lib/commercial/storage";
import { createStripeTestCheckout } from "@/lib/commercial/stripe";

export async function POST(req: NextRequest) {
  const identity=await requestIdentity(); if(!identity.account||identity.account.status!=="active") return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});
  const env=getCloudflareContext().env; const policy=commercialPolicy(env); if(!policy.enabled) return NextResponse.json({error:policy.code},{status:503});
  try {
    const body=JSON.parse(await req.text()); const idempotencyKey=String(body.idempotencyKey??""); const selectedLevel=Number(body.level);
    if(!Number.isInteger(selectedLevel)||selectedLevel<1||selectedLevel>7) throw new Error("INVALID_LEVEL");
    if(!idempotencyKey||idempotencyKey.length>80) throw new Error("INVALID_IDEMPOTENCY_KEY");
    const order=await createPendingOrder(identity.account.userId,selectedLevel,idempotencyKey); if(!order) throw new Error("ORDER_CREATE_FAILED");
    if(order.status!=="pending"||order.stripe_checkout_session_id) return NextResponse.json({orderId:order.id,status:order.status,reused:true},{status:200});
    try {
      const checkout=await createStripeTestCheckout({orderId:order.id,userId:identity.account.userId,selectedLevel,successUrl:`${req.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,cancelUrl:`${req.nextUrl.origin}/checkout/cancel`,secret:env.STRIPE_SECRET_KEY!});
      await attachCheckoutSession(order.id,checkout.id); return NextResponse.json({orderId:order.id,checkoutUrl:checkout.url,mode:"test"},{status:201});
    } catch(error) { await markOrderFailed(order.id); throw error; }
  } catch(error) { const code=error instanceof Error?error.message:"CHECKOUT_FAILED"; return NextResponse.json({error:code},{status:code.startsWith("INVALID")?422:502}); }
}
