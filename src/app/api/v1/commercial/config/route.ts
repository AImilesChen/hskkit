import {NextResponse} from "next/server";
import {getCloudflareContext} from "@opennextjs/cloudflare";
import {publicCommerceConfig} from "@/lib/commercial/public-catalog";

export async function GET(){
  const env=(await getCloudflareContext({async:true})).env;
  return NextResponse.json(publicCommerceConfig(env),{headers:{"cache-control":"no-store"}});
}
