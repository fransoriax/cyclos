-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "surfaceAreaSqm" DOUBLE PRECISION NOT NULL,
    "lightPowerWatts" INTEGER NOT NULL,
    "maxPots" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "setup" TEXT NOT NULL DEFAULT 'carpa',

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vegWeeks" INTEGER NOT NULL,
    "flowerWeeks" INTEGER NOT NULL,
    "photoperiod" BOOLEAN NOT NULL,
    "medium" TEXT NOT NULL,
    "fertilizerType" TEXT NOT NULL,
    "wateringFreqDays" INTEGER NOT NULL,
    "suggestedPrunings" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genetics" TEXT NOT NULL,
    "seedBank" TEXT NOT NULL,
    "photoperiod" BOOLEAN NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "fertilizerType" TEXT NOT NULL,
    "indoor" BOOLEAN NOT NULL,
    "plantCount" INTEGER NOT NULL,
    "potSizeInitial" DOUBLE PRECISION NOT NULL,
    "potSizeIntermediate" DOUBLE PRECISION,
    "potSizeFinal" DOUBLE PRECISION NOT NULL,
    "lightPowerWatts" INTEGER NOT NULL,
    "surfaceAreaSqm" DOUBLE PRECISION NOT NULL,
    "vegWeeksPlanned" INTEGER NOT NULL,
    "flowerWeeksPlanned" INTEGER NOT NULL,
    "spaceId" TEXT,
    "wateringMode" TEXT,
    "wateringFreqDays" INTEGER,
    "fertFreqDays" INTEGER,
    "avgTemp" DOUBLE PRECISION,
    "avgHumidity" DOUBLE PRECISION,
    "logReminderFreq" TEXT,
    "logDayOfWeek" INTEGER,
    "fertDayOfWeek" INTEGER,
    "lastWateringDate" TIMESTAMP(3),
    "experienceLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "growId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "growId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "nodes" INTEGER,
    "tempMin" DOUBLE PRECISION,
    "tempMax" DOUBLE PRECISION,
    "humidityMin" DOUBLE PRECISION,
    "humidityMax" DOUBLE PRECISION,
    "ph" DOUBLE PRECISION,
    "ec" DOUBLE PRECISION,
    "notes" TEXT,
    "photoUrl" TEXT,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WateringLog" (
    "id" TEXT NOT NULL,
    "growId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "volumeLiters" DOUBLE PRECISION NOT NULL,
    "ph" DOUBLE PRECISION,
    "ec" DOUBLE PRECISION,
    "additives" TEXT,

    CONSTRAINT "WateringLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizerLog" (
    "id" TEXT NOT NULL,
    "growId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "productName" TEXT NOT NULL,
    "dosageMlPerL" DOUBLE PRECISION NOT NULL,
    "frequencyDays" INTEGER,
    "notes" TEXT,

    CONSTRAINT "FertilizerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotherPlant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genetics" TEXT NOT NULL,
    "seedBank" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "MotherPlant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloneBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "motherPlantId" TEXT,
    "name" TEXT NOT NULL,
    "cutDate" TIMESTAMP(3) NOT NULL,
    "rootedDate" TIMESTAMP(3),
    "quantityCut" INTEGER NOT NULL,
    "quantityRooted" INTEGER,
    "successRate" DOUBLE PRECISION,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "avgTemp" DOUBLE PRECISION,
    "avgHumidity" DOUBLE PRECISION,

    CONSTRAINT "CloneBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestRecord" (
    "id" TEXT NOT NULL,
    "growId" TEXT NOT NULL,
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "wetWeightGrams" DOUBLE PRECISION,
    "dryWeightGrams" DOUBLE PRECISION NOT NULL,
    "cureStartDate" TIMESTAMP(3),
    "cureEndDate" TIMESTAMP(3),
    "potencyRating" INTEGER,
    "terpenesNotes" TEXT,
    "generalNotes" TEXT,

    CONSTRAINT "HarvestRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HarvestRecord_growId_key" ON "HarvestRecord"("growId");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grow" ADD CONSTRAINT "Grow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grow" ADD CONSTRAINT "Grow_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WateringLog" ADD CONSTRAINT "WateringLog_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizerLog" ADD CONSTRAINT "FertilizerLog_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotherPlant" ADD CONSTRAINT "MotherPlant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloneBatch" ADD CONSTRAINT "CloneBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloneBatch" ADD CONSTRAINT "CloneBatch_motherPlantId_fkey" FOREIGN KEY ("motherPlantId") REFERENCES "MotherPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestRecord" ADD CONSTRAINT "HarvestRecord_growId_fkey" FOREIGN KEY ("growId") REFERENCES "Grow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
