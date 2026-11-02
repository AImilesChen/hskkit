import Link from "next/link";
import HomeIcon from "./home-icon";

export default function HomeNextStep() {
  return <div className="home-cta-stack">
    <div className="home-cta-actions">
      <Link href="/start" className="home-cta-primary">
        <HomeIcon name="route" className="h-5 w-5" />
        <span>Start learning free</span>
        <HomeIcon name="arrow" className="home-cta-arrow h-5 w-5" />
      </Link>
      <a href="#quick-flashcards-demo" className="home-cta-secondary">Preview five flashcards <HomeIcon name="arrow" className="h-4 w-4" /></a>
    </div>
    <ul className="home-cta-trust" aria-label="Before you start">
      {["Free daily practice", "No card required", "Start without an account"].map((item) => <li key={item}><span className="home-cta-check"><HomeIcon name="check" className="h-3.5 w-3.5" /></span>{item}</li>)}
    </ul>
  </div>;
}
