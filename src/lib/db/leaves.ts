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
	const leave = await prisma.annualLeave.findUnique({ where: { id } });

	if (!leave) {
		throw new Error('연차 신청을 찾을 수 없습니다');
	}

	// 이미 동일한 상태이면 중복 처리 방지
	if (leave.status === status) {
		throw new Error(`이미 ${status === 'APPROVED' ? '승인' : '거부'}된 신청입니다`);
	}

	// CANCELLED 상태는 관리자가 변경 불가
	if (leave.status === 'CANCELLED') {
		throw new Error('취소된 신청은 상태를 변경할 수 없습니다');
	}

	// usedLeaves 조정: 이전 상태 → 새 상태에 따라 결정
	const wasApproved = leave.status === 'APPROVED';
	const willBeApproved = status === 'APPROVED';

	if (!wasApproved && willBeApproved) {
		// PENDING/REJECTED → APPROVED: usedLeaves 차감
		await prisma.user.update({
			where: { id: leave.userId },
			data: { usedLeaves: { increment: leave.days } },
		});
	} else if (wasApproved && !willBeApproved) {
		// APPROVED → REJECTED: usedLeaves 복구
		await prisma.user.update({
			where: { id: leave.userId },
			data: { usedLeaves: { decrement: leave.days } },
		});
	}

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

export async function checkLeaveOverlap(userId: string, startDate: Date, endDate: Date) {
	const conflicts = await prisma.annualLeave.findMany({
		where: {
			userId,
			status: { in: ['PENDING', 'APPROVED'] },
			AND: [
				{ startDate: { lte: endDate } },
				{ endDate: { gte: startDate } },
			],
		},
		select: {
			id: true,
			startDate: true,
			endDate: true,
			leaveType: true,
			status: true,
		},
	});

	return {
		overlapping: conflicts.length > 0,
		conflicts,
	};
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
