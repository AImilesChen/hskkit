"use client";
import { useEffect, useState } from "react";
import StrokePlayer from "@/app/components/stroke-player";
import { splitCharacters, starterCharacters, strokeCounts } from "@/lib/strokes/domain";

export default function StrokeTool() {
  const [input, setInput] = useState("中");
  const [characters, setCharacters] = useState(["中"]);
  const [selected, setSelected] = useState("中");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [lastRound, setLastRound] = useState<{ character: string; misses: number }>();
  useEffect(() => {
    const readRound = () => {
      try {
        const raw = JSON.parse(localStorage.getItem("hskkit.stroke-practice.v1") || "[]");
        const last = Array.isArray(raw) ? raw[0] : undefined;
        if (last && typeof last.character === "string" && strokeCounts[last.character] && Number.isInteger(last.misses) && last.misses >= 0) setLastRound({ character: last.character, misses: last.misses });
      } catch { /* Optional browser history. */ }
    };
    readRound(); window.addEventListener("hskkit:stroke-completed", readRound);
    return () => window.removeEventListener("hskkit:stroke-completed", readRound);
  }, []);
  useEffect(() => {
    const incoming = new URLSearchParams(location.search).get("text") || new URLSearchParams(location.search).get("char");
    if (incoming) {
      const chars = splitCharacters(incoming);
      if (chars.length) { setInput(chars.join("")); setCharacters(chars); setSelected(chars[0]); }
    }
    try {
      const raw = JSON.parse(localStorage.getItem("hskkit.stroke-history.v1") || "[]");
      if (Array.isArray(raw)) setHistory(raw.filter(c => typeof c === "string" && Array.from(c).length === 1 && strokeCounts[c]).slice(0, 10));
    } catch { /* History is optional. */ }
  }, []);
  function select(char: string, chars = characters) {
    setSelected(char);
    setHistory(previous => {
      const next = [char, ...previous.filter(c => c !== char)].slice(0, 10);
      try { localStorage.setItem("hskkit.stroke-history.v1", JSON.stringify(next)); } catch { /* Optional storage. */ }
      return next;
    });
    const url = new URL(location.href);
    url.searchParams.delete("char"); url.searchParams.set("text", chars.join(""));
    window.history.replaceState(null, "", url);
  }
  function lookup() {
    const chars = splitCharacters(input);
    if (!chars.length) { setError("Enter at least one Chinese character, for example 学习."); return; }
    if (Array.from(new Set(Array.from(input).filter(c => /\p{Script=Han}/u.test(c)))).length > 12) { setError("Please use up to 12 different characters in one set."); return; }
    setError(""); setCharacters(chars); select(chars[0], chars);
  }
  function sample(char: string) { setInput(char); setCharacters([char]); setError(""); select(char, [char]); }
  const selectedIndex = characters.indexOf(selected);
  const previousCharacter = characters[selectedIndex - 1];
  const nextCharacter = characters[selectedIndex + 1];
  return <div id="stroke-tool" className="stroke-tool">
    <form className="stroke-query" onSubmit={e => { e.preventDefault(); lookup(); }}><label htmlFor="stroke-input">Which characters would you like to write?</label><div><input id="stroke-input" value={input} maxLength={100} onChange={e => setInput(e.target.value)} placeholder="Try 学习 or 你好" aria-describedby="stroke-input-help" aria-invalid={Boolean(error)}/><button className="stroke-primary" type="submit">Look up strokes</button></div><p id="stroke-input-help">Enter a character or short phrase. Choose one character at a time; repeated characters are combined. Up to 12 different characters.</p>{error && <p role="alert" className="stroke-error">{error}</p>}</form>
    <div className="stroke-character-picker" role="group" aria-label="Characters in your set">{characters.map(char => <button type="button" key={char} aria-pressed={selected === char} onClick={() => select(char)}>{char}<span>{strokeCounts[char] ? `${strokeCounts[char]} strokes` : "Unavailable"}</span></button>)}</div>
    <div className="stroke-samples"><span>Try a familiar character</span>{starterCharacters.slice(0, 8).map(char => <button type="button" key={char} onClick={() => sample(char)} aria-label={`Look up ${char}`}>{char}</button>)}<button type="button" onClick={() => sample(starterCharacters[Math.floor(Math.random() * starterCharacters.length)])}>Random character</button></div>
    {history.length > 0 && <div className="stroke-samples"><span>Recent in this browser</span>{history.map(char => <button type="button" key={char} onClick={() => sample(char)}>{char}</button>)}</div>}
    {lastRound && <p className="stroke-saved-round">Last completed in this browser: <strong>{lastRound.character}</strong> · {lastRound.misses} {lastRound.misses === 1 ? "miss" : "misses"}</p>}
    <StrokePlayer character={selected} worksheetText={characters.join("")} characterNavigation={characters.length > 1 ? <nav className="stroke-character-navigation" aria-label="Switch characters in your set">
      <div><span className="stroke-kicker">Character {selectedIndex + 1} of {characters.length}</span><p>Switch characters here. Next stroke below stays on the current character.</p></div>
      <div className="stroke-character-actions"><button type="button" aria-label={previousCharacter ? `Previous character: ${previousCharacter}` : "Previous character"} disabled={!previousCharacter} onClick={() => { if (previousCharacter) select(previousCharacter); }}>← Previous character{previousCharacter && <strong>{previousCharacter}</strong>}</button><button type="button" aria-label={nextCharacter ? `Next character: ${nextCharacter}` : "Next character"} disabled={!nextCharacter} onClick={() => { if (nextCharacter) select(nextCharacter); }}>Next character{nextCharacter && <strong>{nextCharacter}</strong>} →</button></div>
    </nav> : <p className="stroke-single-character">One character selected. Enter a word such as 学习 above to switch between characters.</p>}/>
    <section className="stroke-radicals" aria-labelledby="stroke-radicals-heading"><h2 id="stroke-radicals-heading">A component, then a character.</h2><p>These shortcuts open example characters containing a familiar component.</p><div>{[{ label: "亻 → 你", char: "你", meaning: "person component" }, { label: "氵 → 河", char: "河", meaning: "water component" }, { label: "木 → 林", char: "林", meaning: "tree component" }, { label: "口 → 吃", char: "吃", meaning: "mouth component" }].map(item => <button type="button" key={item.char} onClick={() => sample(item.char)}><strong>{item.label}</strong><span>{item.meaning}</span></button>)}</div></section>
  </div>;
}
