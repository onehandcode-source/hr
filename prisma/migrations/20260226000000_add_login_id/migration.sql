-- This migration is not wrapped in a transaction.

-- loginId 컬럼 추가 (nullable 로 먼저 추가)
ALTER TABLE "User" ADD COLUMN "loginId" TEXT;

-- 기존 사용자: email 값을 loginId로 복사
UPDATE "User" SET "loginId" = "email";

-- NOT NULL 제약 추가
ALTER TABLE "User" ALTER COLUMN "loginId" SET NOT NULL;

-- UNIQUE 인덱스 추가
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");
