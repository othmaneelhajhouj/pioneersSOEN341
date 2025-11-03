-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "role" TEXT NOT NULL,
    "organizerStatus" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "decisionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" TEXT,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("approvedAt", "approvedBy", "createdAt", "decisionReason", "email", "firstName", "id", "lastName", "organizationId", "organizerStatus", "role", "updatedAt") SELECT "approvedAt", "approvedBy", "createdAt", "decisionReason", "email", "firstName", "id", "lastName", "organizationId", "organizerStatus", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_organizerStatus_idx" ON "User"("organizerStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
