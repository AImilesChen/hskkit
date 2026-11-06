# Expanded Chinese-name assets

This is a local build/release guide, not a record of a deployment.

The name tool combines a compact surname collection and given-name collection
in the browser. It does not download the full Cartesian product or call an AI,
database or synthesis API to generate results. The explicit audio manifest is an
offline publication inventory; the application does not fetch it on each use.

## Rebuild

Use the existing pinned `scripts/requirements-number-audio.txt` dependencies.
Run from the repository root:

```powershell
node scripts/build-name-characters.mts
python scripts/build-name-strokes.py
node scripts/build-name-bank.mts
python scripts/build-name-audio.py --deps-target tmp/name-audio-deps --concurrency 16
npm run check:chinese-names
```

The archive for stroke data is the same pinned npm archive used by
`build-stroke-assets.py`. Run that existing base builder first if the archive or
base subset is absent. It now restores the documented name-only additions after
building the catalog subset. Name-only characters are not assigned an HSK level.
Unresolved stroke-count differences remain withheld.

The audio builder resumes verified files and uses an append-only checkpoint
journal under `tmp/name-expansion-20261106/`. The gate checks every current name,
audio path, transcript, file checksum and duration metadata, preserving legacy
saved IDs and audio paths. For selected polyphonic readings, the manifest keeps
the displayed transcript and explicit homophonic synthesis spelling separately,
with hashes for both. This does not constitute a full human listening review.

## Local and production delivery

Local preview serves assets from `public/name-audio/`. Playback requests only the
selected recording, using consistent listen/pause/retry controls.

For a separate static asset origin, set the public build-time variable
`NEXT_PUBLIC_NAME_AUDIO_BASE_URL` to its HTTPS origin, without a path, query or
credentials. Expanded audio resolves to:

```text
https://<asset-origin>/name-audio/v3/<name-id>-nameAudio.mp3
https://<asset-origin>/name-audio/v3/<name-id>-introAudio.mp3
```

Original `/name-audio/v1/` paths remain same-origin for compatibility. The optional
origin can be backed by the project's existing static storage or R2 with a public
resource domain. There is no new Worker synthesis endpoint.

`npm run check:chinese-names` writes a verified file/key inventory to
`tmp/name-expansion-20261106/release-assets.json`. Use its `inventory` entries when
uploading resources. Each entry supplies the object key, SHA-256, byte size,
`audio/mpeg` content type and immutable cache header. Upload and verify the assets
before releasing frontend code that points to that origin. Keep v3 paths immutable
after publishing; changes to the synthesis recipe need a new asset revision.

When using a separate origin, leave `public/name-audio/v3/` out of the Worker
static-assets upload in the isolated release package after the external files
have been verified. Keep the source/local preview files. A remote origin and the
corresponding upload must be configured together; setting the variable alone does
not publish assets. The full manifest is build evidence and can also be omitted
from a production static-assets upload.

The expanded collection references 42,226 clips. Inspect the actual complete
application asset count and account plan before choosing same-origin publication.
Cloudflare currently documents 20,000 files for Workers Free and 100,000 for
Workers Paid per version: [Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/).
The separate-origin option avoids making the name collection depend on that
application asset limit. Local builds do not establish production CPU/billing,
cache behavior or successful remote publication.
