/*
  Warnings:

  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
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
INSERT INTO "new_User" (
    "approvedAt",
    "approvedBy",
    "createdAt",
    "decisionReason",
    "email",
    "firstName",
    "id",
    "lastName",
    "organizationId",
    "organizerStatus",
    "passwordHash",
    "role",
    "updatedAt"
) SELECT
    "approvedAt",
    "approvedBy",
    "createdAt",
    "decisionReason",
    "email",
    "firstName",
    "id",
    "lastName",
    "organizationId",
    "organizerStatus",
    CASE
        WHEN "email" IN ('org1@example.com', 'org2@example.com', 'org3@example.com') THEN '0ca5635222d8f176a83693817616102e:af57aadbdd8223ec64f83cfcdb3b255eaea1d3dc42ebb951dbe8960deb5e83e9062b1621c3bbd57c127f4379647f6a7f75df926742421702b072619639f88557'
        WHEN "email" IN ('student1@example.com', 'student2@example.com', 'student3@example.com', 'student4@example.com') THEN 'df95b179fdda654bd7e866278c25a73a:c22bb2a5bc1821b2fc85b62f233f1581a4dca45700b3fdae6df4b2007e12f70c99694c199acf0514f3838c3367601b1ed1cac33c27e555d1437e87e8daac84fb'
        WHEN "email" = 'admin1@example.com' THEN '5fd65cbc2a59b5bfc9f032f4bec9e526:a634411d586bc3644fbe490be89e7a1641af1d1b6ab8fc41c2f111a121059df2a8cca2931573f67e484245e385379301c4ca163a12b929dd5075bfc8f07ec608'
        ELSE 'd5554e4197db5842a064a06c0a71d75c:ffe9a099420bd772b28587b89a48a2e9827e5dd6840e7e32adfdba65c2fb7d028f4be5a20f91d94a0881230a6758d4ba0be29eb268b806d3936acf54d2785123'
    END,
    "role",
    "updatedAt"
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_organizerStatus_idx" ON "User"("organizerStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
