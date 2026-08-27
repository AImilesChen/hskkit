-- Preserve existing 30-day-planner purchase rights when delivery moves from one PDF to the v3 ZIP bundle.
UPDATE digital_product_entitlements
SET format='zip', version=version+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE product_id='30-day-planner'
  AND delivery_key='product'
  AND artifact_type='planner'
  AND format='pdf'
  AND status IN ('active','refund_pending');

-- Do not let unfinished v2 PDF jobs enter the v3 ZIP validator. Ready PDFs remain downloadable;
-- unfinished jobs are cancelled without debiting a download and the buyer can request the new ZIP.
UPDATE commercial_export_jobs
SET state='cancelled', error_code='PLANNER_DELIVERY_UPGRADED', lease_owner=NULL, lease_expires_at=NULL,
    updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE product_id='30-day-planner'
  AND delivery_key='product'
  AND format='pdf'
  AND state IN ('queued','generating','failed');