-- AlterTable
ALTER TABLE "EvaluationItem" ADD COLUMN "userId" TEXT;

-- AddForeignKey
ALTER TABLE "EvaluationItem" ADD CONSTRAINT "EvaluationItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "EvaluationItem_userId_idx" ON "EvaluationItem"("userId");
