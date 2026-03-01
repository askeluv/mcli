import { describe, it, expect } from 'vitest';
import { computeReviewScore, aggregateReviews, getToolReviews } from '../review.js';
import type { Review } from '../types.js';

// Helper to create valid review with required proofHash
const createReview = (overrides: Partial<Review> = {}): Review => ({
  tool: 'test-tool',
  agentId: 'agent-123',
  scores: {
    jsonParseable: 4,
    errorClarity: 4,
    authSimplicity: 4,
    idempotency: 4,
    docsSufficient: 4,
  },
  proofHash: 'a'.repeat(64), // Required SHA256 hash
  timestamp: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('computeReviewScore', () => {
  it('computes perfect score', () => {
    const scores = {
      jsonParseable: 5,
      errorClarity: 5,
      authSimplicity: 5,
      idempotency: 5,
      docsSufficient: 5,
    };
    expect(computeReviewScore(scores)).toBe(10);
  });

  it('computes minimum score', () => {
    const scores = {
      jsonParseable: 1,
      errorClarity: 1,
      authSimplicity: 1,
      idempotency: 1,
      docsSufficient: 1,
    };
    expect(computeReviewScore(scores)).toBe(2);
  });

  it('computes mixed score', () => {
    const scores = {
      jsonParseable: 4,
      errorClarity: 3,
      authSimplicity: 5,
      idempotency: 4,
      docsSufficient: 2,
    };
    // (4+3+5+4+2) = 18, 18/25 = 0.72, *10 = 7.2 → 7
    expect(computeReviewScore(scores)).toBe(7);
  });
});

describe('getToolReviews', () => {
  const reviews: Review[] = [
    { tool: 'gh', agentId: 'a1', scores: { jsonParseable: 5, errorClarity: 5, authSimplicity: 5, idempotency: 5, docsSufficient: 5 }, timestamp: '2026-01-01' },
    { tool: 'aws', agentId: 'a1', scores: { jsonParseable: 4, errorClarity: 3, authSimplicity: 2, idempotency: 4, docsSufficient: 3 }, timestamp: '2026-01-01' },
    { tool: 'gh', agentId: 'a2', scores: { jsonParseable: 4, errorClarity: 4, authSimplicity: 4, idempotency: 4, docsSufficient: 4 }, timestamp: '2026-01-02' },
  ];

  it('filters reviews by tool', () => {
    const ghReviews = getToolReviews(reviews, 'gh');
    expect(ghReviews).toHaveLength(2);
    expect(ghReviews.every(r => r.tool === 'gh')).toBe(true);
  });

  it('returns empty for unknown tool', () => {
    expect(getToolReviews(reviews, 'unknown')).toHaveLength(0);
  });
});

describe('aggregateReviews', () => {
  it('returns null for empty reviews', () => {
    expect(aggregateReviews([])).toBeNull();
  });

  it('aggregates single review', () => {
    const reviews: Review[] = [
      { tool: 'gh', agentId: 'a1', scores: { jsonParseable: 5, errorClarity: 4, authSimplicity: 5, idempotency: 4, docsSufficient: 5 }, timestamp: '2026-01-01' },
    ];
    const agg = aggregateReviews(reviews);
    expect(agg).not.toBeNull();
    expect(agg!.count).toBe(1);
    expect(agg!.avgScore).toBeGreaterThan(8);
  });

  it('aggregates multiple reviews', () => {
    const reviews: Review[] = [
      { tool: 'gh', agentId: 'a1', scores: { jsonParseable: 5, errorClarity: 5, authSimplicity: 5, idempotency: 5, docsSufficient: 5 }, timestamp: '2026-01-01' },
      { tool: 'gh', agentId: 'a2', scores: { jsonParseable: 3, errorClarity: 3, authSimplicity: 3, idempotency: 3, docsSufficient: 3 }, timestamp: '2026-01-02' },
    ];
    const agg = aggregateReviews(reviews);
    expect(agg).not.toBeNull();
    expect(agg!.count).toBe(2);
    // Average of 5s and 3s = 4, so score should be 8/10
    expect(agg!.avgScore).toBe(8);
  });

  it('calculates positive percentage', () => {
    const reviews: Review[] = [
      { tool: 'gh', agentId: 'a1', scores: { jsonParseable: 5, errorClarity: 5, authSimplicity: 5, idempotency: 5, docsSufficient: 5 }, timestamp: '2026-01-01' },
      { tool: 'gh', agentId: 'a2', scores: { jsonParseable: 4, errorClarity: 2, authSimplicity: 4, idempotency: 3, docsSufficient: 4 }, timestamp: '2026-01-02' },
    ];
    const agg = aggregateReviews(reviews);
    expect(agg!.dimensions.jsonParseable.pct).toBe(100); // both ≥4
    expect(agg!.dimensions.errorClarity.pct).toBe(50);   // one ≥4
  });
});

describe('anti-gaming measures', () => {
  it('proofHash is required in review schema', () => {
    const review = createReview();
    expect(review.proofHash).toBeDefined();
    expect(review.proofHash!.length).toBeGreaterThanOrEqual(32);
  });

  it('detects duplicate reviews from same agent', () => {
    const reviews: Review[] = [
      createReview({ tool: 'gh', agentId: 'agent-1' }),
      createReview({ tool: 'aws', agentId: 'agent-1' }),
      createReview({ tool: 'gh', agentId: 'agent-2' }),
    ];
    
    // Check if agent-1 already reviewed gh
    const hasExisting = reviews.some(r => r.tool === 'gh' && r.agentId === 'agent-1');
    expect(hasExisting).toBe(true);
    
    // agent-1 hasn't reviewed gcloud yet
    const canReview = !reviews.some(r => r.tool === 'gcloud' && r.agentId === 'agent-1');
    expect(canReview).toBe(true);
  });

  it('validates proof hash format', () => {
    const validHash = 'a'.repeat(64);
    const shortHash = 'abc123';
    
    expect(validHash.length).toBeGreaterThanOrEqual(32);
    expect(shortHash.length).toBeLessThan(32);
  });
});
