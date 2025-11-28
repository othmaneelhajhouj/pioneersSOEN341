const { getTrends } = require('../../dist/services/adminAnalyticsTrendsService');
const { prisma } = require('../../dist/db');

// Mock prisma
jest.mock('../../dist/db', () => ({
    prisma: {
        event: {
            findMany: jest.fn(),
        },
        ticket: {
            findMany: jest.fn(),
        },
    },
}));

describe('getTrends', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an object with eventsCreated, ticketsIssued, and ticketsUsed', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');

        prisma.event.findMany.mockResolvedValue([]);
        prisma.ticket.findMany.mockResolvedValue([]);

        const result = await getTrends({ from, to, buckets: 'day' });

        expect(result).toHaveProperty('eventsCreated');
        expect(result).toHaveProperty('ticketsIssued');
        expect(result).toHaveProperty('ticketsUsed');
    });

    it('should correctly tally events by day', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');

        const mockEvents = [
            { createdAt: new Date('2024-01-01T10:00:00Z') },
            { createdAt: new Date('2024-01-01T15:00:00Z') },
            { createdAt: new Date('2024-01-02T09:00:00Z') },
        ];

        prisma.event.findMany.mockResolvedValue(mockEvents);
        prisma.ticket.findMany.mockResolvedValue([]);

        const result = await getTrends({ from, to, buckets: 'day' });

        expect(result.eventsCreated).toEqual([
            { period: '2024-01-01', count: 2 },
            { period: '2024-01-02', count: 1 },
        ]);
    });

    it('should correctly tally tickets issued and used', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');

        const mockIssued = [
            { createdAt: new Date('2024-01-05T10:00:00Z') },
        ];
        const mockUsed = [
            { usedAt: new Date('2024-01-05T12:00:00Z') },
            { usedAt: new Date('2024-01-06T12:00:00Z') },
        ];

        prisma.event.findMany.mockResolvedValue([]);
        prisma.ticket.findMany
            .mockResolvedValueOnce(mockIssued) // First call for issued
            .mockResolvedValueOnce(mockUsed);   // Second call for used

        const result = await getTrends({ from, to, buckets: 'day' });

        expect(result.ticketsIssued).toEqual([
            { period: '2024-01-05', count: 1 },
        ]);
        expect(result.ticketsUsed).toEqual([
            { period: '2024-01-05', count: 1 },
            { period: '2024-01-06', count: 1 },
        ]);
    });

    it('should handle week buckets', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');

        // 2024-01-01 is a Monday.
        // The service uses a custom week calculation:
        // week = floor((dayOfYear + startOfYear.day) / 7)

        const mockEvents = [
            { createdAt: new Date('2024-01-04T10:00:00Z') }, // Week 0 or 1 depending on logic
            { createdAt: new Date('2024-01-05T10:00:00Z') }, // Same week
        ];

        prisma.event.findMany.mockResolvedValue(mockEvents);
        prisma.ticket.findMany.mockResolvedValue([]);

        const result = await getTrends({ from, to, buckets: 'week' });

        expect(result.eventsCreated).toHaveLength(1);
        expect(result.eventsCreated[0].count).toBe(2);
        expect(result.eventsCreated[0].period).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should handle empty data', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');

        prisma.event.findMany.mockResolvedValue([]);
        prisma.ticket.findMany.mockResolvedValue([]);

        const result = await getTrends({ from, to, buckets: 'day' });

        expect(result.eventsCreated).toEqual([]);
        expect(result.ticketsIssued).toEqual([]);
        expect(result.ticketsUsed).toEqual([]);
    });

    it('should call prisma with correct date ranges', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');
        const dateRange = { gte: from, lte: to };

        prisma.event.findMany.mockResolvedValue([]);
        prisma.ticket.findMany.mockResolvedValue([]);

        await getTrends({ from, to, buckets: 'day' });

        expect(prisma.event.findMany).toHaveBeenCalledWith({
            where: { createdAt: dateRange },
            select: { createdAt: true }
        });

        expect(prisma.ticket.findMany).toHaveBeenCalledWith({
            where: { createdAt: dateRange },
            select: { createdAt: true }
        });

        expect(prisma.ticket.findMany).toHaveBeenCalledWith({
            where: { usedAt: { ...dateRange, not: null } },
            select: { usedAt: true }
        });
    });
});