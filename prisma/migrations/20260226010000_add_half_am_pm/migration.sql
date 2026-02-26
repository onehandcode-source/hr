-- This migration is not wrapped in a transaction.
ALTER TYPE "LeaveType" ADD VALUE 'HALF_AM';
ALTER TYPE "LeaveType" ADD VALUE 'HALF_PM';
