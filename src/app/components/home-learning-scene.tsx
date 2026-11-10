import xue from "../../../public/stroke-data/v1/5b66.json";
import HomeIcon from "./home-icon";

// Reuse the writing tool's local stroke shapes and medians. This preview needs
// no client library, audio playback or extra data request.
const strokeKeyframes = xue.strokes.map((_, index) => {
  const start = 4 + index * 7;
  const end = start + 6;
  return `@keyframes home-xue-draw-${index}{0%,${start}%{stroke-dashoffset:1}${end}%,90%{stroke-dashoffset:0}96%,100%{stroke-dashoffset:1}}`;
}).join("\n");

export default function HomeLearningScene() {
  return <div className="home-product-shell home-learning-scene" role="group" aria-labelledby="home-product-preview-title">
    <style>{strokeKeyframes}</style>
    <div className="home-learning-heading">
      <p className="home-product-kicker">More ways to make it stick</p>
      <h2 id="home-product-preview-title">See it. Hear it. Write it.</h2>
    </div>
    <div className="home-learning-composition">
      <div className="home-writing-preview">
        <div className="home-scene-label"><HomeIcon name="pencil" /><span>Stroke order</span></div>
        <div className="home-writing-grid">
          <svg className="home-xue-character" viewBox="0 0 1024 1024" role="img" aria-label="学 — eight strokes, shown in writing order">
            <defs>{xue.strokes.map((path, index) => <clipPath key={index} id={`home-xue-clip-${index}`}><path d={path}/></clipPath>)}</defs>
            <g transform="translate(0,900) scale(1,-1)">
              {xue.strokes.map((path, index) => <path key={`outline-${index}`} d={path} className="home-xue-outline"/>)}
              {xue.medians.map((points, index) => <path key={index}
                d={points.map(([x, y], point) => `${point ? "L" : "M"} ${x} ${y}`).join(" ")}
                clipPath={`url(#home-xue-clip-${index})`} pathLength="1"
                className="home-xue-ink" style={{ animationName: `home-xue-draw-${index}` }}/>) }
            </g>
          </svg>
        </div>
        <div className="home-writing-caption"><strong lang="zh-Latn-pinyin">xué</strong><span>8 strokes · to learn</span></div>
      </div>
      <div className="home-listening-preview">
        <div className="home-scene-label"><HomeIcon name="headphones" /><span>Listen closely</span></div>
        <div className="home-sound-wave" aria-hidden="true">{[14,24,38,22,48,34,58,40,24,48,32,54,28,42,20].map((height, index) => <i key={index} style={{ height, animationDelay: `${index * -0.11}s` }}/>)}</div>
        <strong lang="zh-Latn-pinyin">xué</strong><span>Hear the pronunciation</span>
      </div>
      <div className="home-vocabulary-preview">
        <div className="home-scene-label"><HomeIcon name="book" /><span>Build vocabulary</span></div>
        <p lang="zh-Hans">学 <span aria-hidden="true">→</span> 学习</p>
        <span>From characters to words</span>
      </div>
    </div>
    <ol className="home-learning-path" aria-label="A connected learning path">
      <li><HomeIcon name="book" /><span>Learn</span></li><li><HomeIcon name="headphones" /><span>Listen</span></li><li><HomeIcon name="pencil" /><span>Write</span></li>
    </ol>
  </div>;
}
