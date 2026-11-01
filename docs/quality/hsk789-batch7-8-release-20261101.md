# HSK 7–9 batches 7–8 release acceptance

Published 4,000 reviewed examples covering official sequence 5401–9400. The remaining 1,600 were explicitly pending at this release.

- [PR #90](https://github.com/AImilesChen/hskkit/pull/90), head `7619a03346bcbf32be645280a54469b7e2b9c632`.
- Production merge `eaab65e5839c92aa720b02b264a187a4de2a635f`, tested tree `2ff05cfd04cbbcc2bd8d3ae93416b7e6d58406e8`.
- [CI 41290026677](https://github.com/AImilesChen/hskkit/actions/runs/41290026677) passed.
- [Production deploy 41290438954](https://github.com/AImilesChen/hskkit/actions/runs/41290438954) passed using the existing Cloudflare credentials.
- Live checks passed for 34 advanced word pages, four earlier HSK bands, all four changed catalog records (meaning, reading and part of speech), 4,000 attribution records and two deterministic flashcard samples.

Public vocabulary routes use the build-time static index. Legacy D1 migration 0058 is retained for offline parity and is not a release prerequisite.
