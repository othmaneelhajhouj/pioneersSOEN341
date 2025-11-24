const {getTrends} = require('../../dist/services/adminAnalyticsTrendsService');
const {prisma} = require('../../dist/db');

// database for test
jest.mock('../../dist/db', () => ({
    prisma: {
        $queryRawUnsafe: jest.fn(),
    },
}));

describe('getTrends', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Return the right structure
    it('should return an object with eventsCreated, ticketsIssued, and ticketsUsed', async () => {

        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');


        prisma.$queryRawUnsafe.mockResolvedValue([]);


        const result = await getTrends({ from, to, buckets: 'day' });


        expect(result).toHaveProperty('eventsCreated');
        expect(result).toHaveProperty('ticketsIssued');
        expect(result).toHaveProperty('ticketsUsed');
    });

    // Return data correctly
    it('should return trend data with period and count', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');


        const fakeData = [
            { period: '2024-01-01', count: 5 },
            { period: '2024-01-02', count: 10 },
        ];


        prisma.$queryRawUnsafe
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData);


        const result = await getTrends({ from, to, buckets: 'day' });


        expect(result.eventsCreated).toEqual([
            { period: '2024-01-01', count: 5 },
            { period: '2024-01-02', count: 10 },
        ]);
    });

    // Handle BigInt correctly
    it('should convert BigInt counts to regular numbers', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');


        const fakeData = [
            { period: '2024-01-01', count: BigInt(100) },
        ];

        prisma.$queryRawUnsafe
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData);

        const result = await getTrends({ from, to, buckets: 'day' });


        expect(result.eventsCreated[0].count).toBe(100);
        expect(typeof result.eventsCreated[0].count).toBe('number');
    });

    // Work with empty data
    it('should return empty arrays when no data exists', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');


        prisma.$queryRawUnsafe
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        const result = await getTrends({ from, to, buckets: 'day' });


        expect(result.eventsCreated).toEqual([]);
        expect(result.ticketsIssued).toEqual([]);
        expect(result.ticketsUsed).toEqual([]);
    });

    // Call the database the correct number of times
    it('should make 3 database queries (one for each trend type)', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');

        prisma.$queryRawUnsafe.mockResolvedValue([]);

        await getTrends({ from, to, buckets: 'day' });


        expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(3);
    });

    // Work with 'week' buckets
    it('should work with week buckets', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');

        const fakeData = [
            { period: '2024-01', count: 15 },
        ];

        prisma.$queryRawUnsafe
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData);

        const result = await getTrends({ from, to, buckets: 'week' });


        expect(result.eventsCreated[0].period).toBe('2024-01');
        expect(result.eventsCreated[0].count).toBe(15);
    });

    // Pass the correct dates to the database
    it('should pass the from and to dates to all database queries', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');

        prisma.$queryRawUnsafe.mockResolvedValue([]);

        await getTrends({ from, to, buckets: 'day' });


        expect(prisma.$queryRawUnsafe).toHaveBeenNthCalledWith(
            1,
            expect.any(String),
            from,
            to
        );
        expect(prisma.$queryRawUnsafe).toHaveBeenNthCalledWith(
            2,
            expect.any(String),
            from,
            to
        );
        expect(prisma.$queryRawUnsafe).toHaveBeenNthCalledWith(
            3,
            expect.any(String),
            from,
            to
        );
    });

    // Return all 3 types of data separately
    it('should return separate data for eventsCreated, ticketsIssued, and ticketsUsed', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');


        const eventsData = [{ period: '2024-01-01', count: 5 }];
        const ticketsIssuedData = [{ period: '2024-01-01', count: 10 }];
        const ticketsUsedData = [{ period: '2024-01-01', count: 3 }];

        prisma.$queryRawUnsafe
            .mockResolvedValueOnce(eventsData)
            .mockResolvedValueOnce(ticketsIssuedData)
            .mockResolvedValueOnce(ticketsUsedData);

        const result = await getTrends({ from, to, buckets: 'day' });


        expect(result.eventsCreated[0].count).toBe(5);
        expect(result.ticketsIssued[0].count).toBe(10);
        expect(result.ticketsUsed[0].count).toBe(3);
    });

    // Period always becomes a string
    it('should convert period to a string even if database returns a number', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');


        const fakeData = [
            { period: 20240101, count: 5 },
        ];

        prisma.$queryRawUnsafe
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData);

        const result = await getTrends({ from, to, buckets: 'day' });


        expect(typeof result.eventsCreated[0].period).toBe('string');
        expect(result.eventsCreated[0].period).toBe('20240101');
    });

    // Handles multiple data points
    it('should handle multiple rows of data correctly', async () => {
        const from = new Date('2024-01-01');
        const to = new Date('2024-01-31');

        const fakeData = [
            { period: '2024-01-01', count: 5 },
            { period: '2024-01-02', count: 8 },
            { period: '2024-01-03', count: 12 },
        ];

        prisma.$queryRawUnsafe
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData)
            .mockResolvedValueOnce(fakeData);

        const result = await getTrends({ from, to, buckets: 'day' });


        expect(result.eventsCreated).toHaveLength(3);
        expect(result.eventsCreated[0].count).toBe(5);
        expect(result.eventsCreated[1].count).toBe(8);
        expect(result.eventsCreated[2].count).toBe(12);
    });
});