import { randomUUID } from "node:crypto";

import { redis } from "@/lib/redis";

import type { JobPayload, QueueJob } from "./jobs";

const QUEUE_KEY = "queue:pending";
const PROCESSING_KEY = "queue:processing";

interface EnqueueOptions {
  id?: string;
  delayMs?: number;
  maxAttempts?: number;
}

export async function enqueueJob<T extends JobPayload>(
  payload: T,
  options: EnqueueOptions = {},
): Promise<QueueJob<T>> {
  const id = options.id ?? randomUUID();
  const scheduledAt = Date.now() + (options.delayMs ?? 0);

  const job: QueueJob<T> = {
    id,
    payload,
    scheduledAt,
    attempts: 0,
    maxAttempts: options.maxAttempts ?? 3,
    status: "pending",
  };

  await redis.set(jobKey(id), JSON.stringify(job));
  await redis.zadd(QUEUE_KEY, scheduledAt, id);

  return job;
}

export async function claimNextJob(): Promise<QueueJob | null> {
  const ids = await redis.zrange(QUEUE_KEY, 0, 0);
  if (!ids?.length) {
    return null;
  }

  const id = ids[0]!;
  const raw = await redis.get(jobKey(id));
  if (!raw) {
    await redis.zrem(QUEUE_KEY, id);
    return null;
  }

  const job = JSON.parse(raw) as QueueJob;
  if (job.scheduledAt > Date.now()) {
    return null;
  }

  job.status = "processing";
  job.attempts += 1;

  await redis.zrem(QUEUE_KEY, id);
  await redis.zadd(PROCESSING_KEY, Date.now(), id);
  await redis.set(jobKey(id), JSON.stringify(job));

  return job;
}

export async function completeJob(id: string, result: unknown) {
  const job = await getJob(id);
  if (!job) {
    return;
  }

  job.status = "completed";
  job.result = result;

  await redis.zrem(PROCESSING_KEY, id);
  await redis.set(jobKey(id), JSON.stringify(job));
}

export async function failJob(id: string, error: Error) {
  const job = await getJob(id);
  if (!job) {
    return;
  }

  job.status = "failed";
  job.lastError = error.message;

  await redis.zrem(PROCESSING_KEY, id);
  await redis.set(jobKey(id), JSON.stringify(job));
}

export async function retryJob(id: string) {
  const job = await getJob(id);
  if (!job) {
    return;
  }

  if (job.attempts >= job.maxAttempts) {
    job.status = "failed";
    job.lastError = job.lastError ?? "Max attempts reached";
    await redis.set(jobKey(id), JSON.stringify(job));
    await redis.zrem(PROCESSING_KEY, id);
    return;
  }

  const backoff = Math.min(2 ** job.attempts * 1000, 60_000);
  job.status = "pending";
  job.scheduledAt = Date.now() + backoff;

  await redis.set(jobKey(id), JSON.stringify(job));
  await redis.zrem(PROCESSING_KEY, id);
  await redis.zadd(QUEUE_KEY, job.scheduledAt, id);
}

export async function getJob(id: string) {
  const raw = await redis.get(jobKey(id));
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as QueueJob;
}

export async function pruneStaleProcessing(staleAfterMs = 5 * 60_000) {
  const ids = await redis.zrange(PROCESSING_KEY, 0, -1);
  const now = Date.now();

  for (const id of ids) {
    const job = await getJob(id);
    if (!job) {
      await redis.zrem(PROCESSING_KEY, id);
      continue;
    }
    if (now - job.scheduledAt > staleAfterMs) {
      await retryJob(id);
    }
  }
}

function jobKey(id: string) {
  return `queue:job:${id}`;
}
