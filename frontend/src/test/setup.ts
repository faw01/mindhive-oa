import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { vi } from 'vitest';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock OpenAI embedding functions
vi.mock('ai', () => ({
  embed: vi.fn().mockImplementation((params) => {
    const query = typeof params.value === 'string' ? params.value : '';
    
    // Return different embeddings based on the query
    if (query.toLowerCase().includes('pizza')) {
      // For irrelevant queries, return an embedding that will result in very low similarity
      return Promise.resolve({
        embedding: new Array(1536).fill(-0.1), // This will result in negative similarity
        value: query,
        usage: { tokens: 1 }
      });
    }
    
    // For relevant queries, return an embedding that will result in high similarity
    return Promise.resolve({
      embedding: new Array(1536).fill(0.1),
      value: query,
      usage: { tokens: 1 }
    });
  }),
  
  embedMany: vi.fn().mockImplementation((params) => {
    const values = Array.isArray(params.values) ? params.values : [];
    // Always return embeddings that will result in high similarity with relevant queries
    return Promise.resolve({ 
      embeddings: values.map(() => new Array(1536).fill(0.1)),
      values: values,
      usage: { tokens: 1 }
    });
  }),
  
  streamText: vi.fn(),
  tool: vi.fn()
}));

// Mock environment variables
vi.stubEnv('OPENAI_API_KEY', 'test-key');

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn()); 