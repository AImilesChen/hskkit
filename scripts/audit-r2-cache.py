"""Read-only R2 metadata inventory. This program has no mutation operation."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request

ACCOUNT = '77bc392d46985cd3425691358f5e8a77'
BUCKET = 'hskkit-commercial-exports'
CACHE_PREFIX = 'system/opennext-cache/'
BUILD_RE = re.compile(r'[A-Za-z0-9_-]{21}')
KEY_RE = re.compile(r'([A-Za-z0-9_-]{21})/[a-f0-9]{64}\.(?:cache|fetch)')


def timestamp(value):
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Object timestamp has no timezone')
    return result


def aggregate(objects):
    groups, other, seen = {}, {}, set()
    digest = hashlib.sha256()
    for obj in objects:
        key, size, modified = obj['key'], obj['size'], obj['last_modified']
        if not isinstance(key, str) or not isinstance(size, int) or size < 0 or key in seen:
            raise ValueError('Invalid or duplicate object metadata')
        seen.add(key)
        instant = timestamp(modified).astimezone(timezone.utc).isoformat()
        digest.update(json.dumps([key, size, modified, obj.get('etag')], separators=(',', ':')).encode())
        if key.startswith(CACHE_PREFIX):
            match = KEY_RE.fullmatch(key[len(CACHE_PREFIX):])
            if not match:
                raise ValueError('Unexpected cache-key shape; inventory needs review')
            label = match.group(1)
            group = groups.setdefault(label, {'objects': 0, 'bytes': 0, 'earliest': instant, 'latest': instant})
            group['earliest'] = min(group['earliest'], instant)
            group['latest'] = max(group['latest'], instant)
        else:
            label = next((p for p in ['system/artifacts/', 'system/fonts/', 'private/exports/'] if key.startswith(p)), 'other')
            group = other.setdefault(label, {'objects': 0, 'bytes': 0})
        group['objects'] += 1
        group['bytes'] += size
    return {'cacheBuilds': groups, 'otherPrefixes': other, 'inventoryMetadataSha256': digest.hexdigest(),
            'totalObjects': len(seen), 'totalBytes': sum(g['bytes'] for g in [*groups.values(), *other.values()])}


def classify(report, active_build, as_of):
    if not BUILD_RE.fullmatch(active_build) or active_build not in report['cacheBuilds']:
        raise ValueError('Live production build is absent from the cache inventory')
    cutoff = as_of - timedelta(days=7)
    # These remain review candidates, not deletion authorization. Recent writes are
    # retained conservatively; last-modified time is not assumed to be build age.
    return {build: ('keep-current' if build == active_build else
                    'keep-recent-writes' if timestamp(g['latest']) >= cutoff else
                    'review-old-build') for build, g in report['cacheBuilds'].items()}


def cf_get(path, params=None):
    token = os.environ.get('CLOUDFLARE_API_TOKEN')
    if not token:
        raise RuntimeError('Missing CLOUDFLARE_API_TOKEN')
    url = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/{path}'
    if params:
        url += '?' + urllib.parse.urlencode(params)
    for attempt in range(4):
        request = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'}, method='GET')
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = json.load(response)
            if data.get('success') is not True:
                raise RuntimeError('Cloudflare read failed; no response body or secrets logged')
            return data
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 3:
                raise RuntimeError(f'Cloudflare GET failed with HTTP {error.code}') from None
        except (TimeoutError, urllib.error.URLError):
            if attempt == 3:
                raise RuntimeError('Cloudflare GET timed out') from None
        time.sleep(min(2 ** attempt, 8))


def public_build():
    request = urllib.request.Request('https://hskkit.com/BUILD_ID', headers={'User-Agent': 'HSKKit-R2-readonly-audit/1.0'})
    with urllib.request.urlopen(request, timeout=30) as response:
        value = response.read(100).decode('ascii').strip()
    if not BUILD_RE.fullmatch(value):
        raise RuntimeError('Unexpected live BUILD_ID response')
    return value


def objects():
    cursor, seen_cursors, previous = None, set(), None
    for page in range(1, 1001):
        query = {'per_page': 1000}
        if cursor:
            query['cursor'] = cursor
        response = cf_get(f'r2/buckets/{BUCKET}/objects', query)
        batch, info = response['result'], response.get('result_info', {})
        if not isinstance(batch, list):
            raise RuntimeError('Unexpected object-list response')
        for obj in batch:
            key = obj.get('key')
            if not isinstance(key, str) or (previous is not None and key <= previous):
                raise RuntimeError('Object listing order changed or repeated; rerun the inventory')
            previous = key
            yield obj
        if page % 25 == 0:
            print(f'Inventory: {page} metadata pages read', flush=True)
        if info.get('is_truncated') is False:
            return
        next_cursor = info.get('cursor')
        if not next_cursor and info.get('is_truncated') is not True:
            # The production endpoint can omit is_truncated on its final page.
            # Confirm the boundary with a separate supported start_after query.
            probe = cf_get(f'r2/buckets/{BUCKET}/objects', {'per_page': 1, 'start_after': previous}) if previous else response
            if probe['result'] == [] and probe.get('result_info', {}).get('is_truncated') is not True:
                return
        if not next_cursor or next_cursor in seen_cursors:
            raise RuntimeError('Pagination did not prove completion')
        seen_cursors.add(next_cursor)
        cursor = next_cursor
    raise RuntimeError('Inventory page bound reached')


def check_worker_references():
    # Inspect references only. Never persist settings, environment values,
    # authors, credentials, or unrelated Workers' configuration.
    linked = []
    for script in cf_get('workers/scripts')['result']:
        name = script['id']
        settings = cf_get(f'workers/scripts/{urllib.parse.quote(name, safe="")}/settings')['result']
        bindings = settings.get('bindings', [])
        matched = [b['name'] for b in bindings if b.get('type') == 'r2_bucket' and b.get('bucket_name') == BUCKET]
        if matched:
            prefixes = [b.get('text') for b in bindings if b.get('name') == 'NEXT_INC_CACHE_R2_PREFIX' and b.get('type') == 'plain_text']
            linked.append({'worker': name, 'r2Bindings': matched, 'cachePrefixes': prefixes})
    cache_users = [entry for entry in linked if 'NEXT_INC_CACHE_R2_BUCKET' in entry['r2Bindings']]
    if len(cache_users) != 1 or cache_users[0]['worker'] != 'hskkit' or cache_users[0]['cachePrefixes'] != [CACHE_PREFIX.rstrip('/')]:
        raise RuntimeError('Unexpected cache references; review privately before planning cleanup')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    started = datetime.now(timezone.utc)
    active_before = public_build()
    deployments_before = cf_get('workers/scripts/hskkit/deployments')['result']
    report = aggregate(objects())
    check_worker_references()
    active_after = public_build()
    deployments_after = cf_get('workers/scripts/hskkit/deployments')['result']
    if active_before != active_after or deployments_before != deployments_after:
        raise RuntimeError('Production deployment changed during inventory; no plan produced')
    report.update(account=ACCOUNT, bucket=BUCKET, cachePrefix=CACHE_PREFIX, activeBuild=active_after,
                  startedAt=started.isoformat(), completedAt=datetime.now(timezone.utc).isoformat(),
                  mode='read-only', classifications=classify(report, active_after, started))
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding='utf-8')
    print('R2_READONLY_REPORT_BEGIN')
    print(json.dumps(report, separators=(',', ':'), sort_keys=True))
    print('R2_READONLY_REPORT_END')


if __name__ == '__main__':
    main()
