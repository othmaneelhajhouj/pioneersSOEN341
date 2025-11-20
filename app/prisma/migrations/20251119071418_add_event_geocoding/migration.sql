-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" INTEGER,
    "capacity" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "organizerId" TEXT NOT NULL,
    "generatedBannerPath" TEXT,
    "generatedBannerUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "moderationStatus" TEXT NOT NULL DEFAULT 'pending',
    "moderationReason" TEXT,
    "category" TEXT,
    "formattedAddress" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "geocodeStatus" TEXT NOT NULL DEFAULT 'pending',
    "geocodePrecision" INTEGER,
    "geocodedAt" DATETIME,
    "geocodeMessage" TEXT,
    CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("capacity", "category", "createdAt", "description", "endsAt", "generatedBannerPath", "generatedBannerUrl", "id", "location", "moderationReason", "moderationStatus", "organizerId", "price", "published", "startsAt", "title", "type", "updatedAt") SELECT "capacity", "category", "createdAt", "description", "endsAt", "generatedBannerPath", "generatedBannerUrl", "id", "location", "moderationReason", "moderationStatus", "organizerId", "price", "published", "startsAt", "title", "type", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_type_idx" ON "Event"("type");
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
CREATE INDEX "Event_location_idx" ON "Event"("location");
CREATE INDEX "Event_moderationStatus_idx" ON "Event"("moderationStatus");
CREATE INDEX "Event_category_idx" ON "Event"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
