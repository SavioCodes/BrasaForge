import { getConfig } from "./config";

type UpstashValue = string | number | boolean | null;

interface UpstashResponse<T = UpstashValue> {
  result: T;
  error?: string;
}

const config = getConfig();

export class UpstashRedis {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async request<T = UpstashValue>(command: (string | number)[]): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command: command.map(String) }),
      cache: "no-store",
    });

    if (!res.ok) {
      const message = await res.text();
      throw new Error(`Upstash request failed (${res.status}): ${message}`);
    }

    const json = (await res.json()) as UpstashResponse<T>;

    if (json.error) {
      throw new Error(json.error);
    }

    return json.result;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      return this.request(["SET", key, value, "EX", ttlSeconds]);
    }
    return this.request(["SET", key, value]);
  }

  async get(key: string) {
    return this.request<string | null>(["GET", key]);
  }

  async del(key: string) {
    return this.request<number>(["DEL", key]);
  }

  async incr(key: string) {
    return this.request<number>(["INCR", key]);
  }

  async expire(key: string, ttlSeconds: number) {
    return this.request<number>(["EXPIRE", key, ttlSeconds]);
  }

  async zadd(key: string, score: number, member: string) {
    return this.request<number>(["ZADD", key, score, member]);
  }

  async zrange(key: string, start: number, stop: number) {
    return this.request<string[]>(["ZRANGE", key, start, stop]);
  }

  async zrem(key: string, member: string) {
    return this.request<number>(["ZREM", key, member]);
  }

  async hset(key: string, value: Record<string, string>) {
    return this.request<number>(["HSET", key, ...Object.entries(value).flat()]);
  }

  async hgetall(key: string) {
    const result = await this.request<string[] | null>(["HGETALL", key]);
    if (!result) {
      return null;
    }

    const hash: Record<string, string> = {};
    for (let i = 0; i < result.length; i += 2) {
      hash[result[i]!] = result[i + 1] ?? "";
    }
    return hash;
  }
}

export const redis = new UpstashRedis(config.UPSTASH_REDIS_REST_URL, config.UPSTASH_REDIS_REST_TOKEN);
