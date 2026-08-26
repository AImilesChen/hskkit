import type {Metadata} from "next";
import {notFound} from "next/navigation";
import SiteHeader from "@/app/site-header";
import SiteFooter from "@/app/site-footer";
import {resourceProductDetail,resourceProductDetails} from "@/lib/commercial/resource-products";
import ResourceProductDetail from "./resource-product-detail";

export function generateStaticParams(){
  return resourceProductDetails.map(product=>({productId:product.slug}));
}

export async function generateMetadata({params}:{params:Promise<{productId:string}>}):Promise<Metadata>{
  const {productId}=await params;
  const product=resourceProductDetail(productId);
  if(!product)return {};
  return {title:`${product.name} | HSKKit Store`,description:product.summary,alternates:{canonical:`/store/${product.slug}`},openGraph:{title:product.name,description:product.promise,images:[product.previewImage]}};
}

export default async function ResourceProductPage({params}:{params:Promise<{productId:string}>}){
  const {productId}=await params;
  const product=resourceProductDetail(productId);
  if(!product)notFound();
  const offer=Object.fromEntries([["@type","Offer"],["price",(product.amountCents/100).toFixed(2)],["priceCurrency","USD"],["url",`https://hskkit.com/store/${product.slug}`]]);
  const productJson={"@context":"https://schema.org","@type":"Product",name:product.name,description:product.summary,image:`https://hskkit.com${product.previewImage}`,offers:offer};
  return <><SiteHeader/><main className="mx-auto w-full max-w-[1160px] px-5 py-8 sm:py-12"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(productJson)}}/><ResourceProductDetail product={product}/></main><SiteFooter/></>;
}
