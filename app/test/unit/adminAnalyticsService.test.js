const {getAdminAnalytics} = require('../../dist/services/adminAnalyticsService');
const {prisma} = require('../../dist/db');

// database for test
jest.mock('../../dist/db', () => ({
    prisma: {
        event: {
            count: jest.fn(),
        },
        ticket: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

describe("getAdminAnalytics", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return the correct analytics numbers", async () => {
        prisma.event.count
            .mockResolvedValueOnce(50)
            .mockResolvedValueOnce(35);

        prisma.ticket.count
            .mockResolvedValueOnce(200)
            .mockResolvedValueOnce(150);

        prisma.ticket.findMany.mockResolvedValueOnce([
            { userId: "user1" },
            { userId: "user2" },
            { userId: "user3" },
        ]);

        const result = await getAdminAnalytics();

        // Check result
        expect(result).toEqual({
            eventsTotal: 50,
            eventsPublished: 35,
            ticketsIssued: 200,
            ticketsUsed: 150,
            participantsUnique: 3,
        });
    });

    it("should work when there are no events or tickets", async () => {
        prisma.event.count.mockResolvedValue(0);
        prisma.ticket.count.mockResolvedValue(0);
        prisma.ticket.findMany.mockResolvedValue([]);

        const result = await getAdminAnalytics();

        expect(result).toEqual({
            eventsTotal: 0,
            eventsPublished: 0,
            ticketsIssued: 0,
            ticketsUsed: 0,
            participantsUnique: 0,
        });
    });

    it("should throw an error if the database fails", async () => {
        prisma.event.count.mockRejectedValueOnce(
            new Error("Database connection failed")
        );

        await expect(getAdminAnalytics()).rejects.toThrow(
            "Database connection failed"
        );
    });
});