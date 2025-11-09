import {prisma} from "../db";

type Point = {period: string; count: number};
type Buckets = "day" | "week";

function dateExpr(buckets: Buckets , column: string) {
    return buckets === "day" ? `DATE("${column}")` : `strftime('%Y-%W', "${column}")`           //returns sql snippet of date in days or weeks (formatted Year-Week)
} 

interface getTrendsArgs {
    from: Date;
    to: Date;
    buckets: Buckets
}

export async function getTrends({from, to, buckets}: getTrendsArgs) {

    //sql query templates, passed to prisma. prisma executes them to return relevant rows 
    const eventsCreatedSql = 
    `
    SELECT ${dateExpr(buckets, "createdAt")} AS period, COUNT(*) AS count
    FROM "Event"
    WHERE "createdAt" BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period ASC
    `;

    const ticketsIssuedSql = 
    `SELECT ${dateExpr(buckets, "createdAt")} AS period, COUNT(*) AS count
    FROM "Ticket"
    WHERE "createdAt" BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period ASC
    `;

    const ticketsUsedSql = 
    `SELECT ${dateExpr(buckets, "usedAt")} AS period, COUNT(*) AS count
    FROM "Ticket"
    WHERE "usedAt" IS NOT NULL
    AND "usedAt" BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period ASC
    `;
    
    const [eventsCreatedRaw, ticketsIssuedRaw, ticketsUsedRaw] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(eventsCreatedSql, from, to),
        prisma.$queryRawUnsafe<any[]>(ticketsIssuedSql, from, to),
        prisma.$queryRawUnsafe<any[]>(ticketsUsedSql, from, to),
    ]);

    // need to convert from BigInt to number or res.json() cant parse it => server error 500
    const convert = (rows: any[]): Point[] =>
        rows.map((r) => ({
            period: String(r.period),
            count: typeof r.count === 'bigint' ? Number(r.count) : Number(r.count),
        }));

    return {
        eventsCreated: convert(eventsCreatedRaw),
        ticketsIssued: convert(ticketsIssuedRaw),
        ticketsUsed: convert(ticketsUsedRaw),
    };
}
