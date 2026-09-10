export const LEARNING_HEARTBEAT_DAY_SQL = `
INSERT INTO learning_engagement_days(owner_id,local_day,active_seconds,last_heartbeat_at,created_at,updated_at)
VALUES(?,?,MIN(3600,?),?,?,?)
ON CONFLICT(owner_id,local_day) DO UPDATE SET
  active_seconds=MIN(
    3600,
    learning_engagement_days.active_seconds + MIN(
      excluded.active_seconds,
      MAX(0, CAST((julianday(excluded.last_heartbeat_at)-julianday(learning_engagement_days.last_heartbeat_at))*86400 AS INTEGER))
    )
  ),
  last_heartbeat_at=MAX(learning_engagement_days.last_heartbeat_at,excluded.last_heartbeat_at),
  updated_at=excluded.updated_at
`;

export const LEARNING_POINT_AWARD_SQL = `
INSERT INTO learning_point_ledger(id,owner_id,local_day,period_key,units,source,idempotency_key,created_at)
SELECT ?,?,?,?,
  CASE
    WHEN active_seconds>=3600 THEN 10
    WHEN active_seconds>=1800 THEN 5
    WHEN active_seconds>=600 THEN 1
    ELSE 0
  END,
  'daily_online_learning',?,?
FROM learning_engagement_days
WHERE owner_id=? AND local_day=? AND active_seconds>=600
ON CONFLICT(owner_id,local_day) DO UPDATE SET
  units=MAX(learning_point_ledger.units,excluded.units),
  source=CASE WHEN excluded.units>learning_point_ledger.units THEN excluded.source ELSE learning_point_ledger.source END,
  idempotency_key=CASE WHEN excluded.units>learning_point_ledger.units THEN excluded.idempotency_key ELSE learning_point_ledger.idempotency_key END
`;
