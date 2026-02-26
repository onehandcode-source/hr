import { prisma } from '@/lib/prisma';

export async function getAdminStatistics() {
	const [totalEmployees, pendingLeaves, completedEvaluations, recentLeaves] = await Promise.all([
		// 총 직원 수 (활성 사용자 전체)
		prisma.user.count({
			where: { isActive: true },
		}),

		// 대기 중인 연차 신청
		prisma.annualLeave.count({
			where: { status: 'PENDING' },
		}),

		// 완료된 평가 수
		prisma.evaluation.count({
			where: { status: 'COMPLETED' },
		}),

		// 최근 연차 신청 (최근 5개)
		prisma.annualLeave.findMany({
			take: 5,
			orderBy: { createdAt: 'desc' },
			include: {
				user: {
					select: {
						name: true,
						department: true,
					},
				},
			},
		}),
	]);

	return {
		totalEmployees,
		pendingLeaves,
		completedEvaluations,
		recentLeaves,
	};
}

export async function getEmployeeStatistics(userId: string) {
	const [user, leaveRequests, evaluations] = await Promise.all([
		// 사용자 정보
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				totalLeaves: true,
				usedLeaves: true,
			},
		}),

		// 내 연차 신청 내역 (최근 5개)
		prisma.annualLeave.findMany({
			where: { userId },
			take: 5,
			orderBy: { createdAt: 'desc' },
		}),

		// 최근 평가
		prisma.evaluation.findFirst({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			include: {
				scores: {
					include: {
						item: true,
					},
				},
			},
		}),
	]);

	return {
		leaveBalance: user
			? {
					totalLeaves: user.totalLeaves,
					usedLeaves: user.usedLeaves,
					remainingLeaves: user.totalLeaves - user.usedLeaves,
				}
			: null,
		recentLeaveRequests: leaveRequests,
		latestEvaluation: evaluations,
	};
}
