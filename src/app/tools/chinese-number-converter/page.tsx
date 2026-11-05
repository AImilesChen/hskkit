import type { Metadata } from 'next';
import Link from 'next/link';
import { StudyPage } from '@/app/components/study-shell';
import NumberTool from './number-tool';
import NumberLessons from './number-lessons';
import './numbers.css';

export const metadata: Metadata = {
 title:'Chinese Number Converter & Listening Practice | HSKKit',
 description:'Convert Chinese numbers, RMB prices, dates and times with pinyin. Listen to complete Mandarin recordings, check ten answers and revisit your mistakes for free.',
 alternates:{canonical:'/tools/chinese-number-converter'},
 openGraph:{title:'Chinese Numbers: Convert, Listen & Practise',description:'A clearer reading. An ear for real life. Free Chinese numbers, prices, dates and time practice.',url:'/tools/chinese-number-converter',type:'website'},
};
export default function ChineseNumberPage(){
 const schema={'@context':'https://schema.org','@type':'WebApplication',name:'HSKKit Chinese Number Converter & Listening Practice',url:'https://hskkit.com/tools/chinese-number-converter',applicationCategory:'EducationalApplication',operatingSystem:'Web browser',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}};
 return <StudyPage><main className="numbers-page"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><nav className="number-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/learn">Learning guides</Link><span>/</span><span aria-current="page">Chinese numbers</span></nav><header className="number-hero"><div><h1>Chinese numbers.<br/><span>Read them. Hear them.</span></h1><p>Read numbers, prices, dates and times in Chinese. Then test your listening.</p><ul className="number-hero-highlights" aria-label="Tool highlights"><li className="number-highlight-listen" lang="zh-Hans">一听就懂</li><li className="number-highlight-audio">160 fixed recordings</li><li className="number-highlight-free">Free · No sign-up</li></ul></div></header><NumberTool/><NumberLessons/></main></StudyPage>;
}
