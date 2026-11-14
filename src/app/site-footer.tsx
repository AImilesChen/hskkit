import Link from "next/link";
import "./site-footer.css";

const footerGroups = [
  {
    "title": "Study",
    "links": [
      {
        "href": "/today",
        "label": "Today"
      },
      {
        "href": "/planner",
        "label": "Study Planner"
      },
      {
        "href": "/review",
        "label": "Spaced Review"
      },
      {
        "href": "/practice",
        "label": "Skill Practice"
      },
      {
        "href": "/hsk-test-prep",
        "label": "HSK Practice Tests"
      },
      {
        "href": "/hsk-placement-test",
        "label": "Find My HSK Level"
      }
    ]
  },
  {
    "title": "HSK Vocabulary",
    "links": [
      {
        "href": "/vocabulary/1",
        "label": "HSK 1 Vocabulary"
      },
      {
        "href": "/vocabulary/2",
        "label": "HSK 2 Vocabulary"
      },
      {
        "href": "/vocabulary/3",
        "label": "HSK 3 Vocabulary"
      },
      {
        "href": "/vocabulary/4",
        "label": "HSK 4 Vocabulary"
      },
      {
        "href": "/vocabulary/5",
        "label": "HSK 5 Vocabulary"
      },
      {
        "href": "/vocabulary/6",
        "label": "HSK 6 Vocabulary"
      },
      {
        "href": "/vocabulary/7",
        "label": "Advanced HSK 7–9"
      },
      {
        "href": "/levels",
        "label": "All HSK Levels"
      }
    ]
  },
  {
    "title": "Language Skills",
    "links": [
      {
        "href": "/dictionary",
        "label": "Chinese Dictionary"
      },
      {
        "href": "/grammar",
        "label": "Grammar"
      },
      {
        "href": "/reading",
        "label": "Reading"
      },
      {
        "href": "/listen",
        "label": "Listening"
      }
    ]
  },
  {
    "title": "Learning Tools",
    "links": [
      { "href": "/tools/hsk-vocabulary-comparison", "label": "HSK Vocabulary Comparison" },
      { "href": "/tools/chinese-name-generator", "label": "Chinese Name Generator" },
      { "href": "/tools/chinese-number-converter", "label": "Numbers & Listening" },
      { "href": "/tools/chinese-stroke-order", "label": "Stroke Order & Writing" },
      {
        "href": "/vocabulary/1?mode=flashcards#vocabulary-activities",
        "label": "Flashcards"
      },
      {
        "href": "/tools/chinese-tone-trainer",
        "label": "Tone Trainer"
      },
      {
        "href": "/tools/chinese-character-practice-sheet-generator",
        "label": "Character Worksheets"
      }
    ]
  },
  {
    "title": "Topics",
    "links": [
      {
        "href": "/topics",
        "label": "Browse All Topics"
      },
      {
        "href": "/topics/daily-life",
        "label": "Daily Life"
      },
      {
        "href": "/topics/food-drink",
        "label": "Food & Drink"
      },
      {
        "href": "/topics/travel-transport",
        "label": "Travel & Transport"
      },
      {
        "href": "/chinese-for-travel",
        "label": "Chinese for Travel"
      }
    ]
  },
  {
    "title": "Guides",
    "links": [
      { "href": "/learn", "label": "Learning Guides" },
      {
        "href": "/hsk-3-0",
        "label": "HSK 3.0 Exam Guide"
      },
      {
        "href": "/hsk-2-0-vs-3-0",
        "label": "HSK 2.0 vs 3.0"
      },
      {
        "href": "/blog/hsk-3-0-levels-explained",
        "label": "HSK Levels Explained"
      },
      {
        "href": "/blog/chinese-pinyin-guide",
        "label": "Pinyin Guide"
      },
      {
        "href": "/blog/chinese-tones-guide",
        "label": "Chinese Tones Guide"
      }
    ]
  },
  {
    "title": "Resources",
    "links": [
      {
        "href": "/blog",
        "label": "All Articles"
      },
      {
        "href": "/store",
        "label": "Learning Resource Store"
      },
      {
        "href": "/content-license",
        "label": "Content Sources"
      }
    ]
  },
  {
    "title": "Account & Support",
    "links": [
      {
        "href": "/dashboard",
        "label": "Dashboard"
      },
      {
        "href": "/account",
        "label": "Account"
      },
      {
        "href": "/pricing",
        "label": "Pricing"
      },
      {
        "href": "/exports",
        "label": "My Exports"
      },
      {
        "href": "/contact",
        "label": "Contact"
      }
    ]
  }
];
const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/contact", label: "Contact" },
];

const disclaimer = "HSKKit is an independent study tool and is not affiliated with, endorsed by, sponsored by, or operated by any HSK test organizer or trademark owner.";


function FooterLinks({ links }: { links: typeof footerGroups[number]["links"] }) {
 return <ul>{links.map(item => <li key={item.href}><Link prefetch={false} href={item.href}>{item.label}</Link></li>)}</ul>;
}
export default function SiteFooter() {
 return <footer className="resource-footer"><div className="resource-footer-inner">
 <div className="resource-footer-main"><div className="resource-footer-brand">
 <Link prefetch={false} href="/" className="resource-footer-logo"><span aria-hidden="true">学</span>HSKKit</Link>
 <p className="resource-footer-tagline">Build your HSK vocabulary. Remember what you learn.</p>
 <p>A connected Chinese learning path with vocabulary, daily review, listening and practice for HSK Levels 1–9.</p>
 <Link prefetch={false} href="/today" className="resource-footer-start">Start learning free →</Link></div>
 <div className="resource-footer-groups">{footerGroups.map(group => <nav key={group.title} aria-label={`${group.title} footer links`} className="resource-footer-group">
 <div className="resource-footer-desktop"><h2>{group.title}</h2><FooterLinks links={group.links}/></div>
 <details className="resource-footer-mobile"><summary>{group.title}<span aria-hidden="true">+</span></summary><FooterLinks links={group.links}/></details>
 </nav>)}</div></div>

 <nav aria-label="Directory listings" className="resource-footer-badges" tabIndex={0}>
 <a href="https://firstlook.tools" target="_blank" rel="noopener noreferrer">
 {/* Directory verifiers require the original image URL without an image proxy. */}
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src="https://firstlook.tools/badge/badge_light.svg" alt="Featured on First Look" width={200} height={54} loading="lazy" style={{ display: "block", maxWidth: "100%", height: "auto" }} />
 </a>
 <a href="https://launchpadly.co/startup/hskkit?ref=badge" target="_blank" rel="noopener noreferrer" data-launchpadly-badge="hskkit" data-launchpadly-badge-variant="listed-on">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src="https://launchpadly.co/embed/badges/startup/hskkit.svg?variant=listed-on" alt="Launchpadly Startup Directory" width={260} height={48} loading="lazy" style={{ display: "block", maxWidth: "100%", height: "auto", border: 0 }} />
 </a>
 <a href="https://www.tinyshelf.co/?ref=hskkit.com" title="Featured on TinyShelf">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src="https://www.tinyshelf.co/badge/tinyshelf-badge-dark-f4d1216a.svg" alt="Featured on TinyShelf" width={216} height={64} loading="lazy" style={{ display: "block", maxWidth: "100%", height: "auto" }} />
 </a>
 <a href="https://findly.tools/hskkit?utm_source=hskkit" target="_blank" rel="noopener noreferrer">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src="https://findly.tools/badges/findly-tools-badge-light.svg" alt="Featured on Findly.tools" width={175} height={55} loading="lazy" style={{ display: "block", maxWidth: "100%", height: "auto" }} />
 </a>
 <a href="https://aitop10.tools/" target="_blank" rel="noopener noreferrer">AiTop10 Tools</a>
 <a href="https://saastool.site/item/hskkit?utm_source=hskkit.com" target="_blank" rel="noopener">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src="https://saastool.site/badges/saastool-light.svg" alt="Featured on SaaSTool.site" width={210} height={54} loading="lazy" style={{ display: "block", maxWidth: "100%", height: "auto" }} />
 </a>
 </nav>
 <div className="resource-footer-bottom"><nav aria-label="Legal links">{legalLinks.map(item => <Link prefetch={false} key={item.href} href={item.href}>{item.label}</Link>)}</nav><p>© 2026 HSKKit</p><p>{disclaimer}</p></div>
 </div></footer>;
}

