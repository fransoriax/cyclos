-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Space" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "surfaceAreaSqm" REAL NOT NULL,
    "lightPowerWatts" INTEGER NOT NULL,
    "maxPots" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "setup" TEXT NOT NULL DEFAULT 'carpa',
    CONSTRAINT "Space_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Space" ("createdAt", "id", "lightPowerWatts", "maxPots", "name", "surfaceAreaSqm", "type", "userId") SELECT "createdAt", "id", "lightPowerWatts", "maxPots", "name", "surfaceAreaSqm", "type", "userId" FROM "Space";
DROP TABLE "Space";
ALTER TABLE "new_Space" RENAME TO "Space";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
