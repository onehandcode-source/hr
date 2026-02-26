'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { formatDateKorean } from '@/lib/utils/date';
import LeaveCalendarView from '@/components/common/LeaveCalendarView';
import PageTransition from '@/components/common/PageTransition';

interface LeaveEvent {
	id: string;
	startDate: string;
	endDate: string;
	days: number;
	user: {
		name: string;
		department: string;
	};
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
	ANNUAL: '연차',
	HALF: '반차',
	HALF_AM: '오전반차',
	HALF_PM: '오후반차',
	SICK: '병가',
	SPECIAL: '경조사',
};

const statusClass: Record<string, string> = {
	PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
	APPROVED: 'bg-green-100 text-green-800 hover:bg-green-100',
	REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100',
	CANCELLED: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
};
const statusText: Record<string, string> = {
	PENDING: '대기중',
	APPROVED: '승인',
	REJECTED: '거부',
	CANCELLED: '취소',
};

const cardVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.25 } }),
};

export default function EmployeeDashboard() {
	const queryClient = useQueryClient();

	const {
		data: stats,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['statistics', 'employee'],
		queryFn: async () => {
			const res = await fetch('/api/statistics/employee');
			if (!res.ok) throw new Error('Failed to fetch statistics');
			return res.json();
		},
	});

	const { data: allLeaves } = useQuery({
		queryKey: ['leaves', 'all-approved'],
		queryFn: async () => {
			const res = await fetch('/api/leaves/all');
			if (!res.ok) throw new Error('Failed to fetch leaves');
			return res.json() as Promise<LeaveEvent[]>;
		},
	});

	useEffect(() => {
		if (error) toast.error('통계 데이터를 불러오는데 실패했습니다.');
	}, [error]);

	const cancelMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/leaves/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || '취소 실패');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['statistics', 'employee'] });
			queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
			toast.success('연차 신청이 취소되었습니다.');
		},
		onError: (err: Error) => {
			toast.error(err.message);
		},
	});

	if (isLoading) {
		return <p className="text-muted-foreground">로딩 중...</p>;
	}

	const statCards = [
		{ label: '총 연차', value: `${stats?.leaveBalance?.totalLeaves || 0}일` },
		{ label: '사용한 연차', value: `${stats?.leaveBalance?.usedLeaves || 0}일` },
		{ label: '남은 연차', value: `${stats?.leaveBalance?.remainingLeaves || 0}일` },
	];

	return (
		<PageTransition>
			<div>
				<h1 className="text-2xl font-bold mb-6">직원 대시보드</h1>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					{statCards.map((card, i) => (
						<motion.div key={card.label} custom={i} variants={cardVariants} initial="hidden" animate="visible">
							<Card>
								<CardContent className="p-6">
									<p className="text-sm text-muted-foreground mb-1">{card.label}</p>
									<p className="text-4xl font-bold">{card.value}</p>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>

				<div className="mb-6">
					<h2 className="text-base font-semibold mb-3">내 연차 신청 내역</h2>
					<Card>
						<CardContent className="p-4">
							{stats?.recentLeaveRequests && stats.recentLeaveRequests.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>종류</TableHead>
											<TableHead>시작일</TableHead>
											<TableHead>종료일</TableHead>
											<TableHead>일수</TableHead>
											<TableHead>사유</TableHead>
											<TableHead>상태</TableHead>
											<TableHead>작업</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{stats.recentLeaveRequests.map((leave: any) => (
											<TableRow key={leave.id}>
												<TableCell>
													{LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
												</TableCell>
												<TableCell>{formatDateKorean(new Date(leave.startDate))}</TableCell>
												<TableCell>{formatDateKorean(new Date(leave.endDate))}</TableCell>
												<TableCell>{leave.days}일</TableCell>
												<TableCell>{leave.reason}</TableCell>
												<TableCell>
													<Badge className={statusClass[leave.status] ?? ''}>
														{statusText[leave.status] ?? leave.status}
													</Badge>
												</TableCell>
												<TableCell>
													{leave.status === 'PENDING' && (
														<Button
															size="sm"
															variant="outline"
															className="text-destructive border-destructive hover:bg-destructive/10"
															onClick={() => cancelMutation.mutate(leave.id)}
															disabled={cancelMutation.isPending}
														>
															취소
														</Button>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<p className="text-sm text-muted-foreground">연차 신청 내역이 없습니다.</p>
							)}
						</CardContent>
					</Card>
				</div>

				{stats?.latestEvaluation && (
					<div className="mb-6">
						<h2 className="text-base font-semibold mb-3">최근 평가 결과</h2>
						<Card>
							<CardContent className="p-6">
								<p className="text-sm font-medium mb-1">{stats.latestEvaluation.period} 평가</p>
								<p className="text-3xl font-bold text-primary">
									총점: {stats.latestEvaluation.totalScore?.toFixed(2) || 'N/A'}
								</p>
								{stats.latestEvaluation.comment && (
									<p className="text-sm text-muted-foreground mt-3">
										{stats.latestEvaluation.comment}
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				)}

				<div>
					<h2 className="text-base font-semibold mb-3">전체 직원 일정</h2>
					<Card>
						<CardContent className="p-4">
							<LeaveCalendarView leaves={allLeaves ?? []} title="승인된 연차 현황" />
						</CardContent>
					</Card>
				</div>
			</div>
		</PageTransition>
	);
}
