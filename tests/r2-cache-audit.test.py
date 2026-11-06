import importlib.util
from datetime import datetime, timezone
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('audit', Path(__file__).resolve().parents[1] / 'scripts/audit-r2-cache.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
ACTIVE, OLD, RECENT = 'a' * 21, 'b' * 21, 'c' * 21


def cache(build, date, size=10):
    return dict(key=f'{audit.CACHE_PREFIX}{build}/{"1" * 64}.cache', size=size, last_modified=date)


class AuditTests(unittest.TestCase):
    def test_preserves_business_prefixes_and_current_build(self):
        report = audit.aggregate([cache(ACTIVE, '2026-10-01T00:00:00Z'), cache(OLD, '2026-10-20T00:00:00Z'),
                                  cache(RECENT, '2026-11-05T00:00:00Z'),
                                  dict(key='system/artifacts/product.zip', size=100, last_modified='2026-10-01T00:00:00Z')])
        status = audit.classify(report, ACTIVE, datetime(2026, 11, 6, tzinfo=timezone.utc))
        self.assertEqual(status, {ACTIVE: 'keep-current', OLD: 'review-old-build', RECENT: 'keep-recent-writes'})
        self.assertEqual(report['totalBytes'], 130)
        self.assertEqual(report['otherPrefixes']['system/artifacts/']['bytes'], 100)

    def test_latest_write_retains_a_build_with_old_objects(self):
        old = cache(OLD, '2026-10-01T00:00:00Z')
        new = cache(OLD, '2026-11-06T00:00:00Z')
        new['key'] = new['key'].replace('1' * 64, '2' * 64)
        report = audit.aggregate([cache(ACTIVE, '2026-10-01T00:00:00Z'), old, new])
        self.assertEqual(audit.classify(report, ACTIVE, datetime(2026, 11, 6, tzinfo=timezone.utc))[OLD], 'keep-recent-writes')

    def test_rejects_unknown_shapes_duplicate_keys_and_missing_live_build(self):
        one = cache(OLD, '2026-10-01T00:00:00Z')
        with self.assertRaises(ValueError):
            audit.aggregate([one, one])
        with self.assertRaises(ValueError):
            audit.aggregate([{**one, 'key': audit.CACHE_PREFIX + 'unexpected/file'}])
        with self.assertRaises(ValueError):
            audit.classify(audit.aggregate([one]), ACTIVE, datetime.now(timezone.utc))


if __name__ == '__main__':
    unittest.main()
