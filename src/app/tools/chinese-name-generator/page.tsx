import type { Metadata } from 'next';
import Link from 'next/link';
import { StudyPage } from '@/app/components/study-shell';
import NameTool from './name-tool';
import NameLessons from './name-lessons';
import './names.css';

export const metadata:Metadata={
  title:'Chinese Name Generator with Pinyin & Meanings | HSKKit',
  description:'Create a Chinese name from an English-name meaning, a chosen character or an idea. Choose length and style, hear it and practise writing.',
  alternates:{canonical:'/tools/chinese-name-generator'},
  openGraph:{title:'Chinese Name Generator with Pinyin & Meanings',description:'Find a name you like. Learn what it means, how to say it and how to write it.',url:'/tools/chinese-name-generator',type:'website'},
};

export default function ChineseNameGeneratorPage() {
  const schema=[
    {'@context':'https://schema.org','@type':'WebApplication',name:'HSKKit Chinese Name Generator',url:'https://hskkit.com/tools/chinese-name-generator',applicationCategory:'EducationalApplication',operatingSystem:'Web browser',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:'https://hskkit.com/'},{'@type':'ListItem',position:2,name:'Learning guides',item:'https://hskkit.com/learn'},{'@type':'ListItem',position:3,name:'Chinese name generator',item:'https://hskkit.com/tools/chinese-name-generator'}]},
  ];
  return <StudyPage><main className="names-page"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
    <nav className="name-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/learn">Learning guides</Link><span aria-hidden="true">/</span><span aria-current="page">Chinese names</span></nav>
    <header className="name-hero"><h1>Chinese Name Generator<span>Create a name with meaning.</span></h1><p>Start with your English-name meaning, a favourite character or an idea. Hear your name and learn to write it.</p><ul className="name-hero-features" aria-label="Tool features"><li>Three ways to start</li><li>Mandarin audio</li><li>Free · No sign-up</li></ul></header>
    <NameTool/><NameLessons/>
  </main></StudyPage>;
}
