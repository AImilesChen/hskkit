import { processCommercialExport, type CommercialQueueMessage, type CommercialWorkerEnv } from "../src/lib/commercial/processor.ts";

type QueueMessage<T>={body:T;ack():void;retry():void};
type QueueBatch<T>={messages:QueueMessage<T>[]};
export default {
  async queue(batch: QueueBatch<CommercialQueueMessage>, env: CommercialWorkerEnv) {
    for (const message of batch.messages) {
      try {
        await processCommercialExport(message.body, env);
        message.ack();
      } catch {
        message.retry();
      }
    }
  },
};
