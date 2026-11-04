# Travel phrasebook implementation and verification

Date: 2026-11-04. Status: implemented locally; not deployed.
Preview: http://127.0.0.1:3020/chinese-for-travel

## Scope

New route and scoped CSS/client component: src/app/chinese-for-travel/.
Content/search: src/lib/travel/phrasebook.ts. Exact published-word audio binding: src/lib/travel/server.ts.
Added discovery links from Topics index and Travel & Transport category, plus sitemap entry. Existing dirty files and earlier pending flashcard deployment were not released as part of this work.

50 curated entries: 30 words/expressions and 20 phrases, covering essentials, transport, hotels, food, shopping/payment and help. Each has simplified Chinese, pinyin, English and a usage note. Audio is attached only to an exact published catalog word; 19 entries currently have synthesized word audio. No audio is substituted for a full phrase. No new audio was generated.

Practical features: accent-insensitive English/Chinese/pinyin search with aliases such as toilet, bathroom and cab; situation filters; browser-local saved favourites; large-text native dialog with Escape/focus containment; copy Chinese with failure feedback; slower word playback with single-player cleanup; printable filtered list; group or filtered-set recall practice, with one automatic revisit of uncertain entries and an explicit completion result. Saved items do not promise offline access or account sync. Practice does not change account progress.

## Verification

- npm run typecheck: passed.
- Scoped ESLint for all four new TS/TSX files: passed, zero warnings.
- Travel phrasebook, existing flashcard-preview and sitemap-runtime-safety suites: 9 passed.
- HTTP 200. After stripping all script elements from returned HTML, all 50 article entries and Chinese text remain. Correct canonical present in returned HTML. This validates server-rendered content rather than relying on hydration/RSC payloads.
- Browser: toilet alias and nihao search, save and reload persistence, saved-only filter, copy success, large Chinese, Escape close, keyboard Space reveal, needs-practice revisit, 1/1 remembered completion, empty search reset and Hotels filtering all verified.
- Clicked slow audio playback on 你好; no error message or browser error/warning logs. No claim of human listening review. Existing publication review supplies the word audio provenance.
- 1280x720 desktop and 390x844 / 320x740 mobile checked. No horizontal overflow. At 320px, the long-phrase dialog stays within x19..286, y74.64..665.36. Long Chinese text uses balanced wrapping to avoid a final orphan character.
- Initial header was too tall; compacted typography/padding and removed duplicate results copy. Full long phrases were too large for the dialog; adjusted their responsive sizing and balanced lines.
- Screenshots were opened and inspected: tmp/travel-20261104/desktop-final.jpg, mobile-show-chinese.jpg, mobile-list.jpg. Screenshot raster can be softer than live type after browser viewport overrides.
- Print stylesheet implemented; OS print dialog / paper output not exercised. Full production build and production playback not exercised. This is a local development handoff, not a deployment report.

## Design

Retained HSKKit navigation and typography. Near-white/lilac surfaces, violet actions and restrained pink benefit markers. Chinese text and task actions dominate each entry; mobile stacks content, and situation chips scroll horizontally. No large decorative images, paid bundle changes or forced sign-in were introduced.
