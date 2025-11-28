import { prisma } from "../db";

/**
 * Generates a key for grouping dates.
 * For 'day': returns "YYYY-MM-DD".
 * For 'week': returns "YYYY-WW" (weeks start on Sunday).
 * Uses UTC to ensure consistency regardless of server timezone.
 */
const getPeriodKey = (date: Date, bucket: "day" | "week"): string => {
    if (bucket === "day") return date.toISOString().slice(0, 10);

    const year = date.getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));

    // Calculate week number (0-53) matching SQLite's %W behavior
    // 86400000 = 1000ms * 60s * 60m * 24h (milliseconds in a day)
    const dayOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
    const week = Math.floor((dayOfYear + startOfYear.getUTCDay()) / 7);

    return `${year}-${String(week).padStart(2, "0")}`;
};

/**
 * Groups dates by period and counts occurrences.
 * Returns a sorted list of { period, count } objects.
 * Sorting ensures the frontend receives data in chronological order.
 */
const tally = (dates: (Date | null)[], bucket: "day" | "week") => {
    const counts = dates.reduce((acc, date) => {
        if (!date) return acc; // Skip null dates (e.g. unused tickets)
        const key = getPeriodKey(date, bucket);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).sort().map(period => ({ period, count: counts[period] }));
};

/**
 * Fetches analytics trends for events and tickets within a date range.
 * Aggregates data by day or week.
 * 
 * @param from - Start date of the range
 * @param to - End date of the range
 * @param buckets - Grouping interval ('day' or 'week')
 */
export async function getTrends({ from, to, buckets }: { from: Date; to: Date; buckets: "day" | "week" }) {
    const dateRange = { gte: from, lte: to };

    // Fetch all relevant dates in parallel
    // Only selects the date fields to minimize data transfer
    const [events, issued, used] = await Promise.all([
        prisma.event.findMany({
            where: { createdAt: dateRange },
            select: { createdAt: true }
        }),
        prisma.ticket.findMany({
            where: { createdAt: dateRange },
            select: { createdAt: true }
        }),
        prisma.ticket.findMany({
            where: { usedAt: { ...dateRange, not: null } },
            select: { usedAt: true }
        }),
    ]);

    return {
        eventsCreated: tally(events.map(e => e.createdAt), buckets),
        ticketsIssued: tally(issued.map(t => t.createdAt), buckets),
        ticketsUsed: tally(used.map(t => t.usedAt), buckets),
    };
}
