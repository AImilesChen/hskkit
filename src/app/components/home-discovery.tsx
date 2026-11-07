import Link from 'next/link';
import HomeIcon, {type HomeIconName} from './home-icon';
import {homeTools,featuredGuideSlugs} from '@/lib/home/discovery';
import {convertNumber} from '@/lib/numbers/conversion';
import {publishedGrammarLessons} from '@/lib/learning/step7-content';
import {LISTENING_LIBRARY_QUESTIONS} from '@/lib/learning/listening-library';
import {READING_ARTICLES} from '@/lib/learning/reading-articles';
import blog from '../../../content/blog/manifest.json';

function ToolExample({id}:{id:typeof homeTools[number]['id']}){
  switch(id){
    case 'strokes': return <><strong lang="zh-Hans" className="home-example-hanzi">学</strong><div><span className="home-example-pinyin">xué</span><span>to learn · 8 strokes</span></div></>;
    case 'comparison': return <div className="home-compare-example"><span>Old HSK 4</span><HomeIcon name="arrow" className="h-5 w-5"/><span>New HSK 4</span><p>Keep your foundation.<br/><strong>Find what to add.</strong></p></div>;
    case 'tones': return <div className="home-tone-example" lang="zh-Latn-pinyin">{['mā','má','mǎ','mà'].map((tone,i)=><span key={tone}><strong>{tone}</strong><small>Tone {i+1}</small></span>)}</div>;
    case 'numbers': return <div className="home-number-example"><span>120</span><HomeIcon name="arrow" className="h-4 w-4"/><strong lang="zh-Hans">{convertNumber('120').hanzi}</strong><small>yī bǎi èr shí</small></div>;
    case 'worksheets': return <div className="home-worksheet-example">{['学','习'].map(char=><span key={char}><img src="/flashcards/aqua-writing-grid.png" width="480" height="480" alt="" loading="lazy"/><strong lang="zh-Hans">{char}</strong></span>)}<small>Take your words to paper.</small></div>;
    case 'names': return <div className="home-name-example"><strong lang="zh-Hans">陈嘉宁</strong><span>Chén Jiāníng</span><small>Goodness and a sense of peace.</small></div>;
  }
}

export function HomeTools(){return <section className="home-section home-tools" aria-labelledby="home-tools-heading" id="learning-tools"><div className="home-section-copy"><p className="home-eyebrow">More ways to make it click</p><h2 id="home-tools-heading">Practical tools for your Chinese learning.</h2><p>Hear it, write it, understand it—and find your next step.</p></div><div className="home-tools-grid">{homeTools.map(tool=><article key={tool.id} className="home-tool-card" data-tone={tool.tone}><div className="home-tool-top"><span className="home-tool-icon"><HomeIcon name={tool.icon as HomeIconName} className="h-5 w-5"/></span><span>{tool.label}</span></div><div className="home-tool-example"><ToolExample id={tool.id}/></div><div className="home-tool-copy"><h3>{tool.title}</h3><p>{tool.description}</p><Link prefetch={false} href={tool.href} className="home-discovery-link">{tool.action}<HomeIcon name="arrow" className="h-4 w-4"/></Link></div></article>)}</div></section>;}

export function HomeSkills(){
  const listening=LISTENING_LIBRARY_QUESTIONS.find(q=>q.level===2&&q.lifecycleStatus==='published'&&q.voiceText.length>18);
  const reading=READING_ARTICLES.find(q=>q.level===1);
  const grammar=publishedGrammarLessons.find(q=>q.slug==='comparison-with-bi');
  return <section className="home-section home-skills" aria-labelledby="home-skills-heading"><div className="home-section-copy"><p className="home-eyebrow">From knowing to using</p><h2 id="home-skills-heading">Put your vocabulary to work.</h2><p>Hear a message, follow a story and see how a sentence fits together.</p></div><div className="home-skills-grid">
    {listening&&<article className="home-skill-card" data-tone="teal"><div className="home-skill-heading"><HomeIcon name="headphones" className="h-6 w-6"/><span>Listening · HSK {listening.level}</span></div><h3>Catch the meaning.</h3><div className="home-skill-excerpt"><span>Transcript excerpt</span><p lang="zh-Hans">{listening.voiceText}</p></div><p>Listen to a short recording, then answer from what you hear.</p><Link prefetch={false} className="home-discovery-link" href={`/listen/advanced/${listening.slug}`}>Practise listening<HomeIcon name="arrow" className="h-4 w-4"/></Link></article>}
    {reading&&<article className="home-skill-card" data-tone="green"><div className="home-skill-heading"><HomeIcon name="reading" className="h-6 w-6"/><span>Reading · HSK {reading.level}</span></div><h3>{reading.title}</h3><div className="home-skill-excerpt"><span>Passage excerpt</span><p lang="zh-Hans">{reading.paragraphs[0]}</p></div><p>Read a real-life story and check the details you understood.</p><Link prefetch={false} className="home-discovery-link" href={`/reading/article/${reading.slug}`}>Start reading<HomeIcon name="arrow" className="h-4 w-4"/></Link></article>}
    {grammar&&<article className="home-skill-card" data-tone="purple"><div className="home-skill-heading"><HomeIcon name="grammar" className="h-6 w-6"/><span>Grammar · HSK {grammar.level}</span></div><h3>{grammar.title}</h3><div className="home-skill-excerpt"><span>{grammar.pattern}</span><p lang="zh-Hans">{grammar.examples[0].chinese}</p><p>{grammar.examples[0].english}</p></div><p>Learn the pattern, see it in context and try it yourself.</p><Link prefetch={false} className="home-discovery-link" href={`/grammar/${grammar.slug}`}>Explore grammar<HomeIcon name="arrow" className="h-4 w-4"/></Link></article>}
  </div></section>;
}

export function HomeGuides(){return <section className="home-section home-guides" aria-labelledby="home-guides-heading"><div className="home-section-heading"><div className="home-section-copy"><p className="home-eyebrow">A little guidance goes a long way</p><h2 id="home-guides-heading">Make your next step clearer.</h2><p>Start with pronunciation, understand tones and find your way through the HSK.</p></div><Link prefetch={false} className="home-text-link" href="/learn">All learning guides<HomeIcon name="arrow" className="h-4 w-4"/></Link></div><div className="home-guides-grid">{featuredGuideSlugs.map(slug=>{
    const post=blog.articles.find(p=>p.slug===slug);if(!post)return null;
    return <article key={slug} className="home-guide-card"><img src={`/home-guides/${slug}.webp`} alt={post.imageAlt} width="768" height="512" loading="lazy" decoding="async"/><div><span>{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p><Link prefetch={false} href={`/blog/${slug}`} className="home-discovery-link">Read the guide<HomeIcon name="arrow" className="h-4 w-4"/></Link></div></article>;
  })}</div></section>;}
