import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/credits/estimate/route';

vi.mock('@/lib/providers', () => {
  return {
    getProvider: () => ({
      estimateCost: async () => 21,
    }),
    listProviders: () => [{ id: 'mock', label: 'Mock Provider', supportsImages: false }],
  };
});

describe('POST /api/credits/estimate', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns estimated credits with mocked provider', async () => {
    const request = new Request('http://localhost/api/credits/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'mock',
        model: 'x1',
        promptTokens: 400,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = (await response.json()) as { estimatedCredits: number };
    expect(data.estimatedCredits).toBe(21);
  });
});

