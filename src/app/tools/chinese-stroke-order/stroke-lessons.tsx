import type { ReactNode } from "react";

const rules = [
  { title: "Top before bottom", char: "三", description: "Write the top horizontal stroke, then the middle one, then the bottom one. Notice that the strokes have different lengths." },
  { title: "Left before right", char: "林", description: "Complete the left 木 component before the right one. Look at how the first component becomes narrower to leave room for the second." },
  { title: "Horizontal before vertical", char: "十", description: "Write the horizontal stroke first, then the vertical stroke through it. This is a useful pattern, not a rule for every crossing." },
  { title: "Close the enclosure last", char: "国", description: "Begin the outer enclosure, write 玉 inside, then add the bottom horizontal stroke to close the box." },
];

const strokes = [
  { name: "Horizontal", chinese: "横 · héng", path: "M15 37 L65 37", direction: "Move from left to right.", char: "一" },
  { name: "Vertical", chinese: "竖 · shù", path: "M40 12 L40 62", direction: "Move from top to bottom.", char: "十" },
  { name: "Dot", chinese: "点 · diǎn", path: "M31 24 Q39 29 47 41", direction: "Make a short downward mark.", char: "六" },
  { name: "Left-falling", chinese: "撇 · piě", path: "M55 15 Q46 44 22 61", direction: "Move down towards the left.", char: "人" },
  { name: "Right-falling", chinese: "捺 · nà", path: "M23 15 Q36 48 61 59", direction: "Move down towards the right.", char: "八" },
  { name: "Rising", chinese: "提 · tí", path: "M20 51 L60 24", direction: "Move up towards the right.", char: "地" },
  { name: "Hook", chinese: "钩 · gōu", path: "M43 12 L43 55 Q43 64 31 54", direction: "Finish a stroke with a small hook.", char: "小" },
  { name: "Turn", chinese: "折 · zhé", path: "M16 21 L61 21 L61 61", direction: "Change direction without lifting.", char: "口" },
];

function ExampleLink({ char, children }: { char: string; children?: ReactNode }) {
  // A full navigation lets the tool read the selected example from the URL.
  return <a href={`?text=${encodeURIComponent(char)}#stroke-tool`}>{children || <>Try {char} <span aria-hidden="true">→</span></>}</a>;
}

export default function StrokeLessons() {
  return <div className="stroke-lessons">
    <nav className="stroke-lesson-nav" aria-label="Stroke order lessons"><span>Learn as you practise</span><a href="#how-to-practise">Getting started</a><a href="#basic-strokes">Basic strokes</a><a href="#stroke-order-rules">Writing rules</a><a href="#writing-mistakes">Common mistakes</a></nav>

    <section className="stroke-guide" id="how-to-practise" aria-labelledby="stroke-start-heading">
      <p className="stroke-kicker">01 / Start here</p><h2 id="stroke-start-heading">How to practise Chinese stroke order.</h2>
      <p>You do not need to memorise a whole page of rules before writing your first character. Start with one clear example and move from watching to recalling. The tool above keeps the animation, individual strokes and writing practice together.</p>
      <div className="stroke-how-grid">
        <article><span className="stroke-lesson-number">1</span><h3>Choose a character.</h3><p>Enter a character or a short word. For a word such as 学习, choose one character at a time from the selectors. New to writing? Begin with <ExampleLink char="三">三</ExampleLink>, <ExampleLink char="十">十</ExampleLink> or <ExampleLink char="人">人</ExampleLink>.</p></article>
        <article><span className="stroke-lesson-number">2</span><h3>Watch the movement.</h3><p>Press Play and use the slower speed if needed. Notice the starting point, direction and end of each stroke. Pause the animation, or use Next stroke to see the current stroke in orange.</p></article>
        <article><span className="stroke-lesson-number">3</span><h3>Try it yourself.</h3><p>Switch to Practise writing and draw with a finger or mouse. Follow the same order and direction. After three misses on a stroke, a hint shows its path. Try again before moving on.</p></article>
        <article><span className="stroke-lesson-number">4</span><h3>Take it onto paper.</h3><p>Create a worksheet for your selected characters. Write once with a reference, then cover it and try from memory. Use the character reference to connect the shape with meaning and words.</p></article>
      </div>
    </section>

    <section className="stroke-guide" id="basic-strokes" aria-labelledby="stroke-basics-heading">
      <p className="stroke-kicker">02 / Know the building blocks</p><h2 id="stroke-basics-heading">Basic Chinese strokes and their directions.</h2>
      <p>A stroke is one continuous movement between putting the pen down and lifting it. These eight familiar teaching labels help you describe what you see. Hooks and turns often form part of a longer stroke; they are not always separate pen movements.</p>
      <div className="stroke-type-grid">{strokes.map(stroke => <article key={stroke.name}>
        <svg viewBox="0 0 80 76" aria-hidden="true"><path d="M0 38 H80 M40 0 V76" className="stroke-type-gridline"/><path d={stroke.path} className="stroke-type-mark"/><circle cx={Number(stroke.path.split(" ")[0].slice(1))} cy={Number(stroke.path.split(" ")[1])} r="3" className="stroke-type-start"/></svg>
        <span className="stroke-type-chinese">{stroke.chinese}</span><h3>{stroke.name}</h3><p>{stroke.direction}</p><ExampleLink char={stroke.char}>See it in {stroke.char} →</ExampleLink>
      </article>)}</div>
      <p className="stroke-lesson-note">The orange dot marks the start in these simplified illustrations. For a complete character’s exact path and sequence, open its animated guide.</p>
    </section>

    <section className="stroke-guide" id="stroke-order-rules" aria-labelledby="stroke-rules-heading">
      <p className="stroke-kicker">03 / Spot the pattern</p><h2 id="stroke-rules-heading">Four useful Chinese stroke-order rules.</h2>
      <p>A repeatable sequence makes it easier to practise a character in the same way each time. Use these patterns as a starting point, then check the individual character. Source forms and regional writing conventions can differ.</p>
      <div className="stroke-rule-grid">{rules.map(rule => <article key={rule.char}><span className="stroke-rule-char" aria-hidden="true">{rule.char}</span><h3>{rule.title}</h3><p>{rule.description}</p><ExampleLink char={rule.char}/></article>)}</div>
      <div className="stroke-worked-example"><div className="stroke-worked-character" aria-hidden="true">口<span>3 strokes</span></div><div><h3>A box is not four separate lines.</h3><p>Look closely at 口: write the left vertical first. The top horizontal and right side are a single turning stroke. The bottom horizontal closes the shape. Counting visible edges would give you four; counting continuous pen movements gives you three.</p><ExampleLink char="口">Watch the three strokes of 口 →</ExampleLink></div></div>
    </section>

    <section className="stroke-guide" id="writing-mistakes" aria-labelledby="stroke-mistakes-heading">
      <p className="stroke-kicker">04 / Make practice count</p><h2 id="stroke-mistakes-heading">Common mistakes when learning to write Chinese.</h2>
      <div className="stroke-mistake-grid">
        <article><span className="stroke-mistake-label">Order</span><h3>Copying the shape in any order.</h3><p>A finished character can look familiar even when the sequence is different. Watch once, then use the numbered diagrams to check where each stroke belongs. In writing mode, a stroke in the wrong place or direction may not be accepted.</p></article>
        <article><span className="stroke-mistake-label">Movement</span><h3>Lifting the pen at every corner.</h3><p>Some corners belong to a single turning stroke. Watch <ExampleLink char="口">口</ExampleLink> slowly and follow its top and right side without lifting. Do not split a turn into two strokes simply because its direction changes.</p></article>
        <article><span className="stroke-mistake-label">Recall</span><h3>Tracing without trying from memory.</h3><p>An outline is useful at first. When you are ready, turn off Show outline and try again. Check the reference afterwards. Aim to recall the sequence rather than rushing through repeated traces.</p></article>
        <article><span className="stroke-mistake-label">Feedback</span><h3>Treating a miss as a handwriting grade.</h3><p>The exercise checks an approximate path, direction and order. A mouse, small screen or imprecise gesture can produce a miss. It does not assess calligraphy quality. Slow down, watch the hint and use paper for comfortable handwriting practice.</p></article>
      </div>
      <aside className="stroke-routine"><span className="stroke-kicker">A five-minute routine to try</span><h3>One character. A few focused repetitions.</h3><ol><li><strong>1 minute:</strong> watch the sequence and name the directions.</li><li><strong>2 minutes:</strong> complete a guided round, then try without the outline.</li><li><strong>2 minutes:</strong> write on paper and recall a word containing the character.</li></ol><p>Return to the character in a later study session. If you cannot recall it, look again and make another attempt. Your completed rounds stay in this browser; they do not mark vocabulary as mastered.</p></aside>
    </section>
  </div>;
}
