import type { CatalogSearchDatabase } from "./catalog-search.ts";

const TRANSIENT_D1_OVERLOAD = /(?:\b7429\b|requests queued for too long|d1[^\n]*overload)/i;
const DEFAULT_DELAYS_MS = [125, 400] as const;

type RetryOptions = {
  sleep?: (milliseconds: number) => Promise<void>;
  random?: () => number;
};

const delay = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export function isTransientCatalogD1Overload(error: unknown) {
  return TRANSIENT_D1_OVERLOAD.test(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
}

export async function withCatalogD1ReadRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const sleep = options.sleep ?? delay;
  const random = options.random ?? Math.random;
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientCatalogD1Overload(error) || attempt >= DEFAULT_DELAYS_MS.length) throw error;
      const jitter = Math.floor(random() * 75);
      await sleep(DEFAULT_DELAYS_MS[attempt] + jitter);
    }
  }
}

const retryingDatabases = new WeakSet<object>();
const retryDatabaseCache = new WeakMap<object, CatalogSearchDatabase>();

export function withCatalogD1ReadRetries(db: CatalogSearchDatabase): CatalogSearchDatabase {
  const key = db as object;
  if (retryingDatabases.has(key)) return db;
  const cached = retryDatabaseCache.get(key);
  if (cached) return cached;

  const wrapped: CatalogSearchDatabase = {
    prepare(sql: string) {
      let bindings: Array<string | number> = [];
      const statement = {
        bind(...values: Array<string | number>) {
          bindings = values;
          return statement;
        },
        first<T>() {
          return withCatalogD1ReadRetry(() => {
            const prepared = db.prepare(sql);
            return (bindings.length ? prepared.bind(...bindings) : prepared).first<T>();
          });
        },
        all<T>() {
          return withCatalogD1ReadRetry(async () => {
            const prepared = db.prepare(sql);
            const result = await (bindings.length ? prepared.bind(...bindings) : prepared).all<T>();
            if (!result.success && isTransientCatalogD1Overload(result.error)) {
              throw new Error(result.error || "D1 overloaded");
            }
            return result;
          });
        },
      };
      return statement;
    },
  };
  retryingDatabases.add(wrapped as object);
  retryDatabaseCache.set(key, wrapped);
  return wrapped;
}
