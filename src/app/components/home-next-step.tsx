import Link from "next/link";
import HomeIcon from "./home-icon";

export default function HomeNextStep() {
  return <div className="home-cta-stack">
    <div className="home-cta-actions">
      <Link href="/start" className="home-cta-primary">
        <HomeIcon name="route" className="h-5 w-5" />
        <span>Start learning</span>
        <HomeIcon name="arrow" className="home-cta-arrow h-5 w-5" />
      </Link>
      <a href="#quick-flashcards-demo" className="home-cta-secondary">Preview five flashcards <HomeIcon name="arrow" className="h-4 w-4" /></a>
    </div>
    <p className="home-cta-explanation">Start with published HSK 3.0 vocabulary and build your review plan as you learn.</p>
    <ul className="home-cta-trust" aria-label="Before you start">
      {["7-day Pro trial", "No card required", "Returns to Free automatically"].map((item) => <li key={item}><span className="home-cta-check"><HomeIcon name="check" className="h-3.5 w-3.5" /></span>{item}</li>)}
    </ul>
    <p className="home-cta-free">After the trial: Free includes 10 new items and 20 successful SRS ratings daily.</p>
  </div>;
}
