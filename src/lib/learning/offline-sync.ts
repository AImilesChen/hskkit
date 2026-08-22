export type OfflineSyncState = "local_pending" | "syncing" | "synced" | "conflict" | "failed";

export interface OfflineOperation {
  id: string;
  action: string;
  payload: Record<string, unknown>;
  clientRevision: number;
  state: OfflineSyncState;
  createdAt: string;
  serverRevision?: number;
  failureCode?: string;
  retryable?: boolean;
}

export function beginOfflineOperation(
  input: { action: string; payload: Record<string, unknown>; clientRevision: number },
  id: string,
  createdAt: string,
): OfflineOperation {
  if (!id || !input.action || !Number.isInteger(input.clientRevision) || input.clientRevision < 0) throw new Error("INVALID_OFFLINE_OPERATION");
  return { id, ...input, state: "local_pending", createdAt };
}

export function startOfflineSync(operation: OfflineOperation): OfflineOperation {
  if (operation.state !== "local_pending" && !(operation.state === "failed" && operation.retryable)) throw new Error("INVALID_SYNC_TRANSITION");
  return { ...operation, state: "syncing", failureCode: undefined };
}

export function succeedOfflineOperation(operation: OfflineOperation, serverRevision: number): OfflineOperation {
  if (operation.state !== "syncing" || !Number.isInteger(serverRevision) || serverRevision < operation.clientRevision) throw new Error("INVALID_SYNC_TRANSITION");
  return { ...operation, state: "synced", serverRevision, retryable: false, failureCode: undefined };
}

export function failOfflineOperation(operation: OfflineOperation, failureCode: string, retryable: boolean, serverRevision?: number): OfflineOperation {
  if (operation.state !== "syncing" || !failureCode) throw new Error("INVALID_SYNC_TRANSITION");
  if (failureCode === "REVISION_CONFLICT") {
    if (!Number.isInteger(serverRevision)) throw new Error("INVALID_SYNC_TRANSITION");
    return { ...operation, state: "conflict", failureCode, retryable: true, serverRevision };
  }
  return { ...operation, state: "failed", failureCode, retryable };
}

export function resolveOfflineConflict(operation: OfflineOperation, serverRevision: number): OfflineOperation {
  if (operation.state !== "conflict" || !Number.isInteger(serverRevision)) throw new Error("INVALID_SYNC_TRANSITION");
  return { ...operation, state: "local_pending", clientRevision: serverRevision, serverRevision, failureCode: undefined, retryable: true };
}
