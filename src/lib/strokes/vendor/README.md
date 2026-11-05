# Hanzi Writer 3.7.3

Source: https://registry.npmjs.org/hanzi-writer/-/hanzi-writer-3.7.3.tgz
Archive SHA-256: 015acae9c2aa2779c3c398d34efacd034239251d4795573eeaaa60c0b60f56f2
MIT licence retained in LICENSE and public/stroke-data/HANZI-WRITER-LICENSE.txt.

HSKKit modification, 2026-11-05: retain document pointer-end listeners in RenderTargetBase and add dispose(); add HanziWriter.destroy() to cancel quizzes, animations, renderers and document listeners on React cleanup. Add its type declaration. Remove the unavailable source-map reference. No drawing/grading algorithms changed.

All production calls provide charDataLoader with validated same-origin data. The library's default CDN loader is never invoked by this feature. scripts/build-stroke-assets.py reproduces the unmodified character JSON subset and checks the pinned archive.
