type IconName = "arrow-left" | "arrow-right" | "arrow-up-right" | "arrows-clockwise" | "check" | "shuffle" | "speaker-high" | "speaker-slash" | "circle-notch";

/** Original Phosphor SVG assets, bundled locally with their MIT license. */
export default function FlashcardIcon({ name, className = "" }: { name: IconName; className?: string }) {
  return <span className={`aqua-icon ${className}`} aria-hidden="true" style={{ maskImage: `url(/icons/phosphor/${name}.svg)`, WebkitMaskImage: `url(/icons/phosphor/${name}.svg)` }} />;
}
