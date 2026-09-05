import { EmailMessage } from "cloudflare:email";
import worker, {
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from "../.open-next/worker.js";

globalThis.__hskkitEmailMessage = EmailMessage;

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
export default worker;
