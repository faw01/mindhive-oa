import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { createVectorStore, findRelevantContent } from '@/lib/ai/embedding';
import { streamText } from 'ai';
import type { Mock } from 'vitest';

// Define the parameter type for tool execution
type ToolParams = {
  query: string;
} | {
  id: number;
} | {
  lat: number;
  long: number;
  radius?: number;
};

// Mock the dependencies
vi.mock('@/lib/ai/embedding', () => ({
  createVectorStore: vi.fn(),
  findRelevantContent: vi.fn()
}));

vi.mock('ai', () => ({
  streamText: vi.fn(({ tools }) => {
    // Execute the retrieveOutletInfo tool
    tools.retrieveOutletInfo.execute({ query: 'Test Outlet' });
    return {
      toDataStreamResponse: vi.fn()
    };
  }),
  tool: vi.fn((config) => ({
    ...config,
    execute: async (params: ToolParams) => {
      const result = await config.execute(params);
      return result;
    }
  })),
  default: {
    streamText: vi.fn(() => ({
      toDataStreamResponse: vi.fn()
    })),
    tool: vi.fn((config) => config)
  }
}));

describe('Chat API Route', () => {
  let fetchSpy: Mock;
  let streamTextSpy: Mock;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(global, 'fetch') as Mock;
    streamTextSpy = vi.mocked(streamText);

    // Mock findRelevantContent to return some results
    vi.mocked(findRelevantContent).mockResolvedValue([
      {
        content: 'Test content',
        metadata: {
          id: 1,
          name: 'Test Outlet',
          lat: 3.15,
          lng: 101.71,
          address: 'Test Address',
          operating_hours: '9am-10pm',
          waze_link: 'https://waze.com'
        },
        similarity: 0.9
      }
    ]);
  });

  it('should initialize vector store on first request', async () => {
    const mockOutlets = [
      {
        id: 1,
        name: 'Test Outlet',
        address: 'Test Address',
        operating_hours: '9am-10pm',
        lat: 3.15,
        lng: 101.71,
        waze_link: 'https://waze.com'
      }
    ];

    fetchSpy.mockResolvedValueOnce({
      json: () => Promise.resolve(mockOutlets)
    } as Response);

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] })
    });

    await POST(req);

    expect(createVectorStore).toHaveBeenCalledWith(mockOutlets);
  });

  it('should not reinitialize vector store on subsequent requests', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] })
    });

    await POST(req);

    expect(createVectorStore).not.toHaveBeenCalled();
  });

  it('should handle vector store initialization failure', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('API Error'));

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] })
    });

    await POST(req);

    expect(createVectorStore).not.toHaveBeenCalled();
  });

  it('should use tools in subsequent messages', async () => {
    const mockOutlets = [
      {
        id: 1,
        name: 'Test Outlet',
        address: 'Test Address',
        operating_hours: '9am-10pm',
        lat: 3.15,
        lng: 101.71,
        waze_link: 'https://waze.com'
      }
    ];

    // Mock the outlets API response
    fetchSpy.mockResolvedValue({
      json: () => Promise.resolve(mockOutlets)
    } as Response);

    // First message
    const firstReq = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'What are the operating hours of Test Outlet?' }
        ]
      })
    });

    await POST(firstReq);

    // Verify first message used tools
    expect(streamTextSpy).toHaveBeenCalledTimes(1);
    const firstCall = streamTextSpy.mock.calls[0][0];
    expect(firstCall.model.modelId).toBe('gpt-4o');
    expect(firstCall.tools).toBeDefined();
    expect(vi.mocked(findRelevantContent)).toHaveBeenCalled();

    // Reset the findRelevantContent call count
    vi.mocked(findRelevantContent).mockClear();

    // Second message
    const secondReq = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'What are the operating hours of Test Outlet?' },
          { role: 'assistant', content: 'The operating hours are 9am-10pm.' },
          { role: 'user', content: 'Where is this outlet located?' }
        ]
      })
    });

    await POST(secondReq);

    // Verify second message also used tools
    expect(streamTextSpy).toHaveBeenCalledTimes(2);
    const secondCall = streamTextSpy.mock.calls[1][0];
    expect(secondCall.model.modelId).toBe('gpt-4o');
    expect(secondCall.tools).toBeDefined();
    expect(vi.mocked(findRelevantContent)).toHaveBeenCalled();
  });
}); 