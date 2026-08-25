import {NextResponse} from "next/server";
import {requestIdentity} from "@/lib/account/identity";
import {listDigitalOrders} from "@/lib/commercial/digital-storage";
import {digitalProduct} from "@/lib/commercial/products";
import {listPackOrders} from "@/lib/commercial/storage";
export async function GET(){const identity=await requestIdentity();if(!identity.account||identity.account.status!=="active")return NextResponse.json({error:"ACCOUNT_REQUIRED"},{status:401});const [legacy,digital]=await Promise.all([listPackOrders(identity.account.userId),listDigitalOrders(identity.account.userId)]);const normalized=digital.map((order:any)=>({...order,product_name:digitalProduct(order.product_id)?.name??order.product_id}));return NextResponse.json({orders:[...normalized,...legacy].sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at)))},{headers:{"cache-control":"private, no-store"}});}
