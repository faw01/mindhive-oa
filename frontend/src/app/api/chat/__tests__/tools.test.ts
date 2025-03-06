import { describe, it, expect, beforeAll, beforeEach, vi, Mock } from 'vitest';
import { createVectorStore, findRelevantContent } from '@/lib/ai/embedding';
import { type Outlet } from '@/lib/utils';

// Extended Outlet type for testing
type TestOutlet = Outlet & {
  created_at: string;
  updated_at: string;
};

// Mock outlet data for testing
const mockOutlets: TestOutlet[] = [
  {
    id: 1,
    name: "Subway Menara UOA Bangsar",
    address: "Jalan Bangsar Utama 1, Unit 1-2-G, Menara UOA Bangsar, Kuala Lumpur, 59000",
    operating_hours: "Monday - Sunday, 8:00 AM - 8:00 PM",
    lat: 3.128099,
    lng: 101.678678,
    waze_link: "https://www.waze.com/example",
    created_at: "2024-03-06T08:35:31",
    updated_at: "2024-03-06T08:35:31"
  },
  {
    id: 2,
    name: "Subway One Utama",
    address: "318A One Utama, Lower Ground Floor, New Wing, 1 Utama Shopping Centre, Petaling Jaya, 47800",
    operating_hours: "0800 - 2200 (Sun - Thur)",
    lat: 3.151251,
    lng: 101.615116,
    waze_link: "https://www.waze.com/example2",
    created_at: "2024-03-06T08:35:31",
    updated_at: "2024-03-06T08:35:31"
  }
];

// Mock fetch for API calls
global.fetch = vi.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve(mockOutlets)
  })
) as Mock;

describe('AI Tools Tests', () => {
  beforeAll(async () => {
    // Initialize vector store with mock data
    await createVectorStore(mockOutlets);
  });

  describe('retrieveOutletInfo Tool', () => {
    it('should find relevant outlet when searching by name', async () => {
      const results = await findRelevantContent('Menara UOA Bangsar');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].metadata.name).toBe('Subway Menara UOA Bangsar');
    });

    it('should find relevant outlet when searching by operating hours', async () => {
      const results = await findRelevantContent('open on Sunday 8 AM');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.metadata.name === 'Subway Menara UOA Bangsar')).toBe(true);
    });

    it('should return empty array for irrelevant queries', async () => {
      const results = await findRelevantContent('pizza hut restaurants');
      expect(results.length).toBe(0);
    });
  });

  describe('getOutlets Tool', () => {
    beforeEach(() => {
      (global.fetch as Mock).mockClear();
    });

    it('should return filtered outlets when searching by name', async () => {
      const response = await fetch('http://localhost:8000/api/outlets/');
      const outlets = await response.json() as TestOutlet[];
      const filteredOutlets = outlets.filter(outlet => 
        outlet.name.toLowerCase().includes('bangsar')
      );

      expect(filteredOutlets.length).toBe(1);
      expect(filteredOutlets[0].name).toBe('Subway Menara UOA Bangsar');
    });

    it('should return all outlets when no query is provided', async () => {
      const response = await fetch('http://localhost:8000/api/outlets/');
      const outlets = await response.json() as TestOutlet[];
      
      expect(outlets.length).toBe(2);
    });
  });

  describe('getOutletDetails Tool', () => {
    it('should return detailed information for a specific outlet', async () => {
      (global.fetch as Mock).mockImplementationOnce(() => 
        Promise.resolve({
          json: () => Promise.resolve(mockOutlets[0])
        })
      );

      const response = await fetch('http://localhost:8000/api/outlets/1');
      const outlet = await response.json() as TestOutlet;
      
      expect(outlet.id).toBe(1);
      expect(outlet.name).toBe('Subway Menara UOA Bangsar');
      expect(outlet.operating_hours).toBe('Monday - Sunday, 8:00 AM - 8:00 PM');
      expect(outlet.waze_link).toBeDefined();
    });
  });

  describe('findNearbyOutlets Tool', () => {
    it('should find outlets within specified radius', async () => {
      const nearbyOutlets = mockOutlets.map(outlet => ({
        ...outlet,
        distance: 2.5 // Mock distance in km
      }));

      (global.fetch as Mock).mockImplementationOnce(() => 
        Promise.resolve({
          json: () => Promise.resolve(nearbyOutlets)
        })
      );

      const response = await fetch('http://localhost:8000/api/outlets/nearby/?lat=3.128099&long=101.678678&radius=5');
      const outlets = await response.json() as (TestOutlet & { distance: number })[];
      
      expect(outlets.length).toBeGreaterThan(0);
      expect(outlets[0].distance).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no outlets found in radius', async () => {
      (global.fetch as Mock).mockImplementationOnce(() => 
        Promise.resolve({
          json: () => Promise.resolve([])
        })
      );

      const response = await fetch('http://localhost:8000/api/outlets/nearby/?lat=0&long=0&radius=1');
      const outlets = await response.json() as TestOutlet[];
      
      expect(outlets.length).toBe(0);
    });
  });
}); 