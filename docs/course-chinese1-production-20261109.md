# Chinese 1 course-review production release

Release scope: Chinese 1 A/B/C only. A is free without an account; B/C reuse existing Pro, active-trial and eligible-pass authorization. Existing HSK/AP papers, prices, production database and disabled cleanup schedules are unchanged.

Entry: `/chinese-course-tests`, exposed in Tests, HSK test preparation, pricing and the public sitemap. Paper introductions and protected workspaces are noindex. Every protected file, including HEAD and Range requests, checks entitlement before returning bytes. Direct formal-media paths remain blocked.

Each frozen bank has 20 listening and 20 reading questions, two writing tasks, and two speaking tasks (four S1 responses and one S2 recording). Section budgets are 15/20/15/10 minutes. The workspace supports section clocks, simplified/traditional reading, raw objective accuracy, explanations after submission, browser-local writing, microphone recording, recording imports/downloads and response exports. PDFs, audio and portable packs are available through the same guarded file service.

Writing and speaking require self-review or review by the learner's own teacher; no included marking service, automatic grade, official score conversion or school-credit claim. Frozen provenance still records independent teacher review, human listening acceptance and learner pilot as pending. Publication is not a fabricated content certification.

Validation: production build; 64 course/HSK/AP/storage contract checks; four navigation checks; 73 local HTTP checks; browser flows for all three forms with synthetic microphone audio and simulated timing transitions (75 checks); 195 rendered PDF pages checked for text bounds and visually reviewed via all nine contact sheets. Microphone tests establish application recording/storage behavior, not physical microphone quality. Synthetic local free/Pro/expired accounts verify authorization; no production payment or real subscriber purchase was claimed. Existing baseline development favicon conflict is outside this release.

Source parent: `0f7d90bd6fd0418dcd384d40093d8b567b92ae75`. Isolated staging and an explicit file allowlist preserve unrelated dirty workspace changes and missing historical files. Production deployment and post-release URL checks are recorded separately after the deployment completes. Restore by reverting this release commit on the existing production branch and rerunning its deployment workflow; existing papers and subscriptions need no data rollback.
