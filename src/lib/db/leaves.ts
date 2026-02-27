import { prisma } from '@/lib/prisma';
import { LeaveStatus, LeaveType } from '@prisma/client';

export async function getLeaveRequests(filters?: {
	status?: LeaveStatus;
	userId?: string;
	startDate?: Date;
	endDate?: Date;
}) {
	const where: any = {};

	if (filters?.status) {
		where.status = filters.status;
	}

	if (filters?.userId) {
		where.userId = filters.userId;
	}

	if (filters?.startDate || filters?.endDate) {
		where.AND = [];
		if (filters.startDate) {
			where.AND.push({
				startDate: { gte: filters.startDate },
			});
		}
		if (filters.endDate) {
			where.AND.push({
				endDate: { lte: filters.endDate },
			});
		}
	}

	return prisma.annualLeave.findMany({
		where,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					department: true,
					position: true,
				},
			},
		},
		orderBy: {
			createdAt: 'desc',
		},
	});
}

export async function getLeaveRequest(id: string) {
	return prisma.annualLeave.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					department: true,
					position: true,
				},
			},
		},
	});
}

export async function createLeaveRequest(data: {
	userId: string;
	startDate: Date;
	endDate: Date;
	days: number;
	reason: string;
	leaveType?: LeaveType;
}) {
	return prisma.annualLeave.create({
		data: {
			userId: data.userId,
			startDate: data.startDate,
			endDate: data.endDate,
			days: data.days,
			reason: data.reason,
			status: 'PENDING',
			leaveType: data.leaveType ?? 'ANNUAL',
		},
	});
}

export async function cancelLeaveRequest(id: string, userId: string) {
	const leave = await prisma.annualLeave.findUnique({ where: { id } });

	if (!leave) {
		throw new Error('연차 신청을 찾을 수 없습니다');
	}

	if (leave.userId !== userId) {
		throw new Error('권한이 없습니다');
	}

	if (leave.status !== 'PENDING') {
		throw new Error('대기 중인 신청만 취소할 수 있습니다');
	}

	return prisma.annualLeave.update({
		where: { id },
		data: { status: 'CANCELLED' },
	});
}

export async function updateLeaveRequestStatus(
	id: string,
	status: LeaveStatus,
	reviewedBy: string,
	reviewNote?: string,
) {
	// 승인인 경우 사용자의 usedLeaves 업데이트
	if (status === 'APPROVED') {
		const leave = await prisma.annualLeave.findUnique({
			where: { id },
		});

		if (leave) {
			await prisma.user.update({
				where: { id: leave.userId },
				data: {
					usedLeaves: {
						increment: leave.days,
					},
				},
			});
		}
	}

	// 거부에서 승인으로 변경하는 경우 usedLeaves 복구 로직 필요
	// (간단한 구현을 위해 생략, 실제로는 이전 상태 확인 필요)

	return prisma.annualLeave.update({
		where: { id },
		data: {
			status,
			reviewedBy,
			reviewedAt: new Date(),
			reviewNote,
		},
	});
}

export async function getUserLeaveBalance(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			totalLeaves: true,
			usedLeaves: true,
		},
	});

	if (!user) {
		return null;
	}

	const pendingResult = await prisma.annualLeave.aggregate({
		where: { userId, status: 'PENDING' },
		_sum: { days: true },
	});
	const pendingDays = Number(pendingResult._sum.days ?? 0);
	const remainingLeaves = user.totalLeaves - user.usedLeaves;

	return {
		totalLeaves: user.totalLeaves,
		usedLeaves: user.usedLeaves,
		remainingLeaves,
		pendingDays,
		effectiveRemaining: remainingLeaves - pendingDays,
	};
}
