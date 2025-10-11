-- CreateIndex
CREATE INDEX "Entry_week_idx" ON "Entry"("week");

-- CreateIndex
CREATE INDEX "Entry_month_idx" ON "Entry"("month");

-- CreateIndex
CREATE INDEX "Entry_providerId_idx" ON "Entry"("providerId");

-- CreateIndex
CREATE INDEX "Load_week_idx" ON "Load"("week");

-- CreateIndex
CREATE INDEX "Load_month_idx" ON "Load"("month");

-- CreateIndex
CREATE INDEX "Load_providerId_idx" ON "Load"("providerId");
