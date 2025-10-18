import { describe, expect, it } from 'vitest';

import { buildSitePrompt } from '@/lib/ai/prompts';
import { listProviders } from '@/lib/providers';

describe('providers', () => {
  it('should expose all configured providers with labels', () => {
    const providers = listProviders();
    const ids = providers.map((provider) => provider.id);

    expect(ids).toContain('openai');
    expect(ids).toContain('anthropic');
    expect(ids).toContain('google');

    providers.forEach((provider) => {
      expect(provider.label.length).toBeGreaterThan(0);
    });
  });
});

describe('prompts', () => {
  it('builds prompt containing required sections', () => {
    const result = buildSitePrompt({
      sector: 'educacao',
      tone: 'moderno',
      palette: 'navy e roxo',
      additionalInstructions: 'Foco em leads B2B',
    });

    expect(result).toContain('hero');
    expect(result).toContain('features');
    expect(result).toContain('CTA');
    expect(result).toContain('FAQ');
    expect(result).toContain('JSON');
  });
});

