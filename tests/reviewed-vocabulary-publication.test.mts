import assert from "node:assert/strict";
import test from "node:test";
import { approvedRelease, publication, validatePublication } from "../scripts/check-reviewed-vocabulary-publication.mts";

test("existing dashboard publication covers every current delivery and records sampled read-back honestly", () => {
  assert.equal(validatePublication(approvedRelease, publication).files, 30);
  assert.equal(validatePublication(approvedRelease, publication).readBackScope, "sampled-complete-bundle-only");
});

test("publication gate rejects artifact drift, unuploaded versions and incomplete upload evidence", () => {
  const altered = structuredClone(approvedRelease);
  altered.files[0].sha256 = "0".repeat(64);
  assert.throws(() => validatePublication(altered, publication), /ARTIFACT_MANIFEST_MISMATCH/);
  assert.throws(() => validatePublication(approvedRelease, publication, () => "unuploaded-v99"), /DELIVERY_SET_MISMATCH/);
  const incomplete = structuredClone(publication);
  incomplete.batches[0].uploadedFileCount--;
  assert.throws(() => validatePublication(approvedRelease, incomplete), /BATCH_COUNT_MISMATCH/);
  const badSample = structuredClone(publication);
  badSample.readBackSamples[0].sha256 = "0".repeat(64);
  assert.throws(() => validatePublication(approvedRelease, badSample), /READ_BACK_SAMPLE_MISMATCH/);
});
