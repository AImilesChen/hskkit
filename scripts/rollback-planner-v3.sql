-- Run against production D1 BEFORE rolling the application and export worker back to a pre-v3 release.
-- Ready v3 ZIP jobs remain downloadable. Unfinished v3 jobs are cancelled without consuming a download.
UPDATE digital_product_entitlements
SET format='pdf', version=version+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE product_id='30-day-planner'
  AND delivery_key='product'
  AND artifact_type='planner'
  AND format='zip'
  AND status IN ('active','refund_pending');

UPDATE commercial_export_jobs
SET state='cancelled', error_code='PLANNER_V3_ROLLED_BACK', lease_owner=NULL, lease_expires_at=NULL,
    updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE product_id='30-day-planner'
  AND delivery_key='product'
  AND format='zip'
  AND state IN ('queued','generating','failed');