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
 <div className="resource-footer-bottom"><nav aria-label="Legal links">{legalLinks.map(item => <Link prefetch={false} key={item.href} href={item.href}>{item.label}</Link>)}</nav><p>© 2026 HSKKit</p><p>{disclaimer}</p></div>
 </div></footer>;
}
