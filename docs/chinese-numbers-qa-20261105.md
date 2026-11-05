# Chinese numbers — local implementation and verification

Status: development complete on 2026-11-05; not deployed. Local production-build preview: `http://127.0.0.1:3023/tools/chinese-number-converter`.

## Delivered scope

- Independent `/tools/chinese-number-converter` route with Numbers, Prices, Dates and Times scenes, each with a consistent color and text label. Responsive conversion and listening views.
- Numbers: standard Chinese/digits conversion, signed values through 999,999,999, up to four decimal places, preserved decimal zeros, dictionary-tone pinyin, place-value explanation and optional financial character equivalents. Ambiguous abbreviated Chinese forms are rejected.
- RMB prices: exact string processing with at most two decimals; everyday 块/毛/分 and written 元/角/分. Excess precision is rejected rather than rounded.
- Dates: Gregorian calendar 1900–2100, actual leap-day validation, digitwise years, spoken 号 and written 日.
- Times: 24-hour input, parts of day, 两点/半/一刻 and a full-minute alternative. No timezone conversion.
- Listening: 40 fixed whole-utterance recordings per scene, ten distinct questions per round, complete playback before checking, immutable first checked answers, independent mistake rounds and up to twenty locally saved rounds with resume.
- Static teaching sections with number grouping, a price breakdown, a calendar diagram and a clock diagram, plus FAQ and linked examples. Added discovery in existing navigation/footer, learning guides, travel content, sitemap and pronunciation attribution.
- No new runtime API, database migration, account sync, payment change or runtime synthesis-service request.

## Audio and reproducibility

160 MP3 files, totaling 2,019,888 bytes, are stored as local project assets under `public/number-audio/v1/`. The generated question manifest includes transcript/script hashes, file checksums and decoded durations. Content-hashed filenames and the versioned `_headers` cache rule allow immutable asset caching.

The voice is Microsoft `zh-CN-XiaoxiaoNeural` at -10% rate, generated once using pinned `edge-tts 7.3.1` and `mutagen 1.48.1`. The website does not execute this generation script. Rebuild scripts are `scripts/build-number-bank.mts`, `scripts/build-number-audio.py` and `scripts/requirements-number-audio.txt`. Rebuilding the unchanged bank preserved its exact bytes; running the audio builder again reused the existing matching recordings.

Recorded examples use these static assets. Arbitrary converter values use a separately labelled Mandarin device voice when available, with an explicit unavailable/error state. Device voice availability and quality depend on the browser/device. Pinyin displays dictionary tones; connected speech may change tone realization. There is no claim of full human pronunciation review or professional recording.

## Browser verification

Used the in-app browser against local development and then the final production build:

- `25.50` in Numbers retained `二十五点五零`; reverse `一万零一` returned `10001`.
- Price `25.50` produced `二十五块五毛` and `二十五元五角`. `25.501` displayed an excess-precision error and hid the old reading.
- The leap-day example `2024-02-29` displayed the correct year/month/day reading. Invalid date handling is covered by domain tests; the browser's native date input does not accept an invalid leap-day string through fill.
- `14:30` produced `下午两点半`; `02:05` produced `凌晨两点零五分`.
- A ten-question Times round played every complete recording, using known test fixtures for expected answers and one deliberately wrong answer. Result: 9/10. The separate mistake round scored 1/1 and retained its separate result.
- Slow playback exposed a real source-change reset; fixed `defaultPlaybackRate` alongside `playbackRate`. The next question was verified at actual media rate 0.8, matching the selected speed.
- Saved after one checked answer, reloaded, and continued at question 2/10. Original and retry results remained separate.
- Temporarily moved one audio file in the isolated local preview copy. The UI displayed a retry message and kept Check answer locked without scoring. Restored the file, retried playback, and observed the complete-listen unlock. The original source assets were not moved.
- Checked 320px viewport layout: all four converter scenes had document width equal to available width (305px after scrollbar), with no horizontal overflow. Also inspected mobile listening and teaching content. Moved the feedback trigger into normal document flow on this page at small widths so it cannot cover answer controls, and kept the hero's Chinese note on one line.
- A teaching link loaded `?mode=prices&value=25.50#number-tool`, selected Prices, prefilled 25.50 and displayed its correct reading. Copy reading reported success.
- Desktop screenshot: `tmp/number-development-20261105/converter-desktop.png`; mobile teaching screenshot: `tmp/number-development-20261105/mobile-lessons.png`.

These are browser playback/interaction and fixture checks, not a physical-device or full human listening review.

## Automated verification

- Scoped ESLint passed for new feature, data builder, shared player and touched integration files.
- 17 relevant tests passed: six number/audio/practice tests plus eleven existing listening, review playback and dictionary audio regression checks.
- Number coverage includes 0–20,000 and 500 deterministic larger integer roundtrips, known expected readings, invalid/ambiguous forms, exact decimal handling, prices, calendar/time boundaries, all 160 audio hashes, manifest pairing and scoring/storage invariants.
- Final Next production build and typecheck passed, generating 956 static pages. The new tool route is statically prerendered (34 kB route, 145 kB first-load JS as reported by Next).
- HTTP checks passed for the new route and linked-example URL, travel page, attribution page, sitemap and one hashed MP3 from each scene. Canonical is `https://hskkit.com/tools/chinese-number-converter`; teaching content and one H1 are present in server HTML; sitemap includes the route.
- Plain `next start` cannot serve the existing `/learn` route's Cloudflare-dependent catalog lookup without bindings. Its inserted link is verified in source and typechecked. This is a local preview limitation; a full Cloudflare adapter/deployment smoke test has not been performed for this feature.
- Final preview feature source was hash-compared with the implementation: all ten feature/shared-player files matched. Detailed results are in `tmp/number-development-20261105/verification.json` and `browser-checks.json`.

## Build environment and release boundary

The workspace has unrelated pending changes and historical build copies. Verification used an isolated copy at `tmp/stroke-order-20261105/build-source`, excluding recursive historical temporary sources from typechecking. Only this copy sets the tracing root to its directory and limits build workers to one to fit local memory. Production configuration was not changed for these accommodations.

The Cloudflare asset configuration does not enable `run_worker_first`. Conversion/scoring are client-side and audio files are static assets; production CPU/billing and deployed cache headers have not been measured. Deployment should package and verify the 160 files and cache rule, then smoke-test the new route and existing guide entry under actual Cloudflare bindings.

No commit, push or deployment was performed for this feature. A later release must isolate this change from the workspace's unrelated pending work.


## Follow-up: hero grouping

Removed the detached right-hand note card after screenshot feedback. Its Chinese listening tagline, fixed-recording count and free-access note now sit together below the introduction as orange/purple/green labels aligned with the title and tool controls. Removed the old desktop column allocation and obsolete card rules at all breakpoints.

Scoped page ESLint and the production build/typecheck passed again (956 pages). Browser checks at 1280px and 320px confirmed shared left alignment, absence of the old card, natural label wrapping and no horizontal overflow. Screenshots: `tmp/number-development-20261105/hero-inline-desktop.png` and `hero-inline-mobile.png`. Preview remains on port 3023; this update is local only.


## Follow-up: consistent device-voice controls

For converted values without an exact fixed recording, replaced the plain device-voice text button with the same colored audio panel, speaker icon, and Play audio action used by recorded values. The panel retains an explicit Device pronunciation source and availability note. Loading, unavailable, error/retry, playing/stop and completed states keep the control visible. Owned utterances are cancelled on unmount/value change; obsolete completion/error callbacks cannot reset a later utterance.

Verified the reported Chinese input 一千一百 → 1100 in the browser: the speaker button appeared, synthesis entered Playing/Stop audio, and completion returned to Play audio. Also checked a long number's stop/replay behavior, changing the value while speaking, and the existing fixed 128 recording. At 320px, the button remained usable and document width equalled available width (305px). These checks used an environment with a Mandarin device voice; an actual device without one was not available for testing.

Scoped ESLint, six existing number/audio/practice tests, and the full production build/typecheck passed. Preview source for both modified files matches the implementation. Screenshots: `tmp/number-development-20261105/device-playback-desktop.png` and `device-playback-mobile.png`. No deployment performed.


## Follow-up: whole-page copy and readable type

Reviewed the hero, all four converter scenes, practice setup/questions/feedback/results, learning diagrams, guides and FAQ. Kept the established English UI, four-color system, route, functions and teaching material.

- Removed decorative eyebrow lines and shortened repetitive scene descriptions, input hints and practice instructions. Routine conversion announcements remain available to screen readers without another visible success line.
- Consolidated result breakdown, pinyin/tone rules, audio-source explanation and financial equivalents into one Reading notes disclosure, closed initially. The source label and actual audio status remain beside the visible play button.
- Practice now states correct/incorrect answers directly, with an optional Why this reading? disclosure for mistakes. Preserved the listen-before-check gate, score rules, saved-round resume and storage warnings.
- Replaced tiny Selected text with a visible checkmark while retaining aria-pressed. Raised feature content to a minimum of 13px; primary instructions/actions are 14px and teaching/FAQ body text is 16px. Removed mobile rules that reduced text to 9–12px.
- Retained teaching paragraphs and meaningful internal links. Simplified guide headings and FAQ answers; audio-source details link to the existing attribution page. Canonical/metadata remain accurate; no ranking claim or new structured-data promise.

Scoped ESLint, six existing number/audio/practice tests, and the production build/typecheck passed. Browser checks exercised the Reading notes disclosure, all four scenes with notes expanded at 320px (no horizontal overflow and no visible feature text below 13px), 16px teaching text, and expanded audio-source FAQ. A ten-question Times round gave 9/10 with one intentional mistake; its separate retry gave 1/1. Used known test fixtures for expected answers. Verified updated gating, correct/wrong feedback and result copy.

The page returned HTTP 200; all four guide headings, FAQ and disclosure content remain server rendered, with one H1. All six feature files in the preview match source. Screenshots: `tmp/number-development-20261105/copy-converter-desktop.png`, `copy-lessons-mobile.png`, and `copy-faq-mobile.png`. Browser evidence is in `copy-browser-checks.json`. This is local verification; no deployment or physical-device reading test was performed.
