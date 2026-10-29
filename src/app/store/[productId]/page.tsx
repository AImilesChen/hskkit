import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Link from "next/link";
import {getCloudflareContext} from "@opennextjs/cloudflare";
import SiteHeader from "@/app/site-header";
import SiteFooter from "@/app/site-footer";
import {storeProductDetail,storeProductDetails} from "@/lib/commercial/product-details";
import ResourceProductDetail from "./resource-product-detail";
import StoreMobileStyle from "../store-mobile-style";
import {publicCommerceConfig} from "@/lib/commercial/public-catalog";

export const dynamic="force-dynamic";

export function generateStaticParams(){
  return storeProductDetails.map(product=>({productId:product.slug}));
}

export async function generateMetadata({params}:{params:Promise<{productId:string}>}):Promise<Metadata>{
  const {productId}=await params;
  const product=storeProductDetail(productId);
  if(!product)return {};
  return {title:`${product.name} | HSKKit Store`,description:product.summary,alternates:{canonical:`/store/${product.slug}`},openGraph:{title:product.name,description:product.promise,images:[product.previewImage]}};
}

export default async function ResourceProductPage({params}:{params:Promise<{productId:string}>}){
  const {productId}=await params;
  const product=storeProductDetail(productId);
  if(!product)notFound();
  const config=publicCommerceConfig((await getCloudflareContext({async:true})).env);
  const currentProduct=config.products.find(item=>item.id===product.slug);
  const offer=Object.fromEntries([["@type","Offer"],["price",((currentProduct?.saleAmountCents??product.amountCents)/100).toFixed(2)],["priceCurrency","USD"],["url",`https://hskkit.com/store/${product.slug}`]]);
  const productJson={"@context":"https://schema.org","@type":"Product",name:product.name,description:product.summary,image:`https://hskkit.com${product.previewImage}`,offers:offer};
  const hasCurrentLevelOnePdf=["level-1","starter-1-3","complete-1-9"].includes(productId);
  return <><StoreMobileStyle/><SiteHeader/><main data-store-route className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:py-12"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(productJson)}}/>{hasCurrentLevelOnePdf&&<p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm leading-6 text-emerald-950">The included Level 1 PDF now matches the 2025 exam syllabus and the online <Link className="font-semibold underline" href="/vocabulary/1">300-word HSK 1 list</Link>. {productId!=="level-1"&&"Other level PDFs in this bundle remain on their separately published versions; check their samples and counts before buying."}</p>}<ResourceProductDetail product={product}/></main><SiteFooter/></>;
}
