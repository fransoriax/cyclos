-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "surfaceAreaSqm" REAL NOT NULL,
    "lightPowerWatts" INTEGER NOT NULL,
    "maxPots" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Space_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vegWeeks" INTEGER NOT NULL,
    "flowerWeeks" INTEGER NOT NULL,
    "photoperiod" BOOLEAN NOT NULL,
    "medium" TEXT NOT NULL,
    "fertilizerType" TEXT NOT NULL,
    "wateringFreqDays" INTEGER NOT NULL,
    "suggestedPrunings" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Grow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genetics" TEXT NOT NULL,
    "seedBank" TEXT NOT NULL,
    "photoperiod" BOOLEAN NOT NULL,
    "startDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "fertilizerType" TEXT NOT NULL,
    "indoor" BOOLEAN NOT NULL,
    "plantCount" INTEGER NOT NULL,
    "potSizeInitial" REAL NOT NULL,
    "potSizeIntermediate" REAL,
    "potSizeFinal" REAL NOT NULL,
    "lightPowerWatts" INTEGER NOT NULL,
    "surfaceAreaSqm" REAL NOT NULL,
    "vegWeeksPlanned" INTEGER NOT NULL,
    "flowerWeeksPlanned" INTEGER NOT NULL,
    "spaceId" TEXT,
    "wateringMode" TEXT,
    "wateringFreqDays" INTEGER,
    "fertFreqDays" INTEGER,
    "avgTemp" REAL,
    "avgHumidity" REAL,
    "logReminderFreq" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Grow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Grow_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "growId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Task_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "growId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "heightCm" REAL,
    "nodes" INTEGER,
    "tempMin" REAL,
    "tempMax" REAL,
    "humidityMin" REAL,
    "humidityMax" REAL,
    "ph" REAL,
    "ec" REAL,
    "notes" TEXT,
    "photoUrl" TEXT,
    CONSTRAINT "DailyLog_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WateringLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "growId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "volumeLiters" REAL NOT NULL,
    "ph" REAL,
    "ec" REAL,
    "additives" TEXT,
    CONSTRAINT "WateringLog_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FertilizerLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "growId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "productName" TEXT NOT NULL,
    "dosageMlPerL" REAL NOT NULL,
    "frequencyDays" INTEGER,
    "notes" TEXT,
    CONSTRAINT "FertilizerLog_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MotherPlant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genetics" TEXT NOT NULL,
    "seedBank" TEXT,
    "startDate" DATETIME NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    CONSTRAINT "MotherPlant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CloneBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "motherPlantId" TEXT,
    "name" TEXT NOT NULL,
    "cutDate" DATETIME NOT NULL,
    "rootedDate" DATETIME,
    "quantityCut" INTEGER NOT NULL,
    "quantityRooted" INTEGER,
    "successRate" REAL,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "avgTemp" REAL,
    "avgHumidity" REAL,
    CONSTRAINT "CloneBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CloneBatch_motherPlantId_fkey" FOREIGN KEY ("motherPlantId") REFERENCES "MotherPlant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HarvestRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "growId" TEXT NOT NULL,
    "harvestDate" DATETIME NOT NULL,
    "wetWeightGrams" REAL,
    "dryWeightGrams" REAL NOT NULL,
    "cureStartDate" DATETIME,
    "cureEndDate" DATETIME,
    "potencyRating" INTEGER,
    "terpenesNotes" TEXT,
    "generalNotes" TEXT,
    CONSTRAINT "HarvestRecord_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HarvestRecord_growId_key" ON "HarvestRecord"("growId");
