import type {Metadata} from 'next';
import Link from 'next/link';
import {StudyPage} from '@/app/components/study-shell';
import ComparisonTool from './comparison-tool';
import ComparisonLessons from './comparison-lessons';
import './comparison.css';

export const metadata:Metadata={title:'HSK 2.0 vs HSK 3.0 Vocabulary Comparison | HSKKit',description:'Compare your old HSK study range with a new HSK target. Find shared vocabulary and words to add, export CSV and practise your exact filtered list.',alternates:{canonical:'/tools/hsk-vocabulary-comparison'},openGraph:{title:'HSK 2.0 vs HSK 3.0 Vocabulary Comparison',description:'Find what carries over and build your next vocabulary study list.',url:'/tools/hsk-vocabulary-comparison',type:'website'}};
export default function HskVocabularyComparisonPage(){
 const schema=[{'@context':'https://schema.org','@type':'WebApplication',name:'HSKKit HSK Vocabulary Comparison',url:'https://hskkit.com/tools/hsk-vocabulary-comparison',applicationCategory:'EducationalApplication',operatingSystem:'Web browser',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:'https://hskkit.com/'},{'@type':'ListItem',position:2,name:'Learning guides',item:'https://hskkit.com/learn'},{'@type':'ListItem',position:3,name:'HSK vocabulary comparison',item:'https://hskkit.com/tools/hsk-vocabulary-comparison'}]}];
 return <StudyPage><main className="cmp-page"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
  <nav className="cmp-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/learn">Learning guides</Link><span aria-hidden="true">/</span><span aria-current="page">HSK vocabulary comparison</span></nav>
  <header className="cmp-hero"><div><p className="cmp-eyebrow">HSK 2.0 → 2025 syllabus</p><h1>Moving to the new HSK?<span>Find the words to add.</span></h1><p>Compare your previous study range with your new HSK goal, then build a focused vocabulary list.</p></div><svg className="cmp-hero-art" viewBox="0 0 360 210" aria-hidden="true"><rect x="2" y="2" width="356" height="206" rx="26" fill="#f7f3fc"/><circle cx="135" cy="104" r="75" fill="#e1efe9" stroke="#438579" strokeWidth="1.5"/><circle cx="235" cy="104" r="75" fill="#f9e8d7" fillOpacity=".82" stroke="#b67a48" strokeWidth="1.5"/><path d="M185 48a75 75 0 0 1 0 112 75 75 0 0 1 0-112" fill="#a6cdbb"/><text x="111" y="97" fill="#195c4d" fontSize="19" fontWeight="600" textAnchor="middle">Old HSK</text><text x="111" y="121" fill="#195c4d" fontSize="14" textAnchor="middle">Your range</text><text x="259" y="97" fill="#904915" fontSize="19" fontWeight="600" textAnchor="middle">New HSK</text><text x="259" y="121" fill="#904915" fontSize="14" textAnchor="middle">Your goal</text><path d="m174 104 8 8 15-18" fill="none" stroke="#195c4d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg></header>
  <ComparisonTool/><ComparisonLessons/>
 </main></StudyPage>;
}
