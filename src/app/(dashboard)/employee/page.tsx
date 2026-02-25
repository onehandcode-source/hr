'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	Box,
	Typography,
	Grid,
	Card,
	CardContent,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Button,
} from '@mui/material';
import { formatDateKorean } from '@/lib/utils/date';
import LeaveCalendarView from '@/components/common/LeaveCalendarView';

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
	SICK: '병가',
	SPECIAL: '경조사',
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
		return <Typography>로딩 중...</Typography>;
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'PENDING':
				return 'warning';
			case 'APPROVED':
				return 'success';
			case 'REJECTED':
				return 'error';
			case 'CANCELLED':
				return 'default';
			default:
				return 'default';
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'PENDING':
				return '대기중';
			case 'APPROVED':
				return '승인';
			case 'REJECTED':
				return '거부';
			case 'CANCELLED':
				return '취소';
			default:
				return status;
		}
	};

	return (
		<Box>
			<Typography variant="h4" component="h1" gutterBottom>
				직원 대시보드
			</Typography>

			<Grid container spacing={3} sx={{ mt: 2 }}>
				<Grid size={{ xs: 12, md: 4 }}>
					<Card>
						<CardContent>
							<Typography color="text.secondary" gutterBottom>
								총 연차
							</Typography>
							<Typography variant="h3">{stats?.leaveBalance?.totalLeaves || 0}일</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, md: 4 }}>
					<Card>
						<CardContent>
							<Typography color="text.secondary" gutterBottom>
								사용한 연차
							</Typography>
							<Typography variant="h3">{stats?.leaveBalance?.usedLeaves || 0}일</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid size={{ xs: 12, md: 4 }}>
					<Card>
						<CardContent>
							<Typography color="text.secondary" gutterBottom>
								남은 연차
							</Typography>
							<Typography variant="h3">{stats?.leaveBalance?.remainingLeaves || 0}일</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			<Box sx={{ mt: 4 }}>
				<Typography variant="h6" gutterBottom>
					내 연차 신청 내역
				</Typography>
				<Card>
					<CardContent>
						{stats?.recentLeaveRequests && stats.recentLeaveRequests.length > 0 ? (
							<TableContainer>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell>종류</TableCell>
											<TableCell>시작일</TableCell>
											<TableCell>종료일</TableCell>
											<TableCell>일수</TableCell>
											<TableCell>사유</TableCell>
											<TableCell>상태</TableCell>
											<TableCell>작업</TableCell>
										</TableRow>
									</TableHead>
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
													<Chip
														label={getStatusText(leave.status)}
														color={getStatusColor(leave.status) as any}
														size="small"
													/>
												</TableCell>
												<TableCell>
													{leave.status === 'PENDING' && (
														<Button
															size="small"
															variant="outlined"
															color="error"
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
							</TableContainer>
						) : (
							<Typography color="text.secondary">연차 신청 내역이 없습니다.</Typography>
						)}
					</CardContent>
				</Card>
			</Box>

			{stats?.latestEvaluation && (
				<Box sx={{ mt: 4 }}>
					<Typography variant="h6" gutterBottom>
						최근 평가 결과
					</Typography>
					<Card>
						<CardContent>
							<Typography variant="subtitle1" gutterBottom>
								{stats.latestEvaluation.period} 평가
							</Typography>
							<Typography variant="h4" color="primary">
								총점: {stats.latestEvaluation.totalScore?.toFixed(2) || 'N/A'}
							</Typography>
							{stats.latestEvaluation.comment && (
								<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
									{stats.latestEvaluation.comment}
								</Typography>
							)}
						</CardContent>
					</Card>
				</Box>
			)}

			{/* 전체 직원 일정 */}
			<Box sx={{ mt: 4 }}>
				<Typography variant="h6" gutterBottom>
					전체 직원 일정
				</Typography>
				<Card>
					<CardContent>
						<LeaveCalendarView leaves={allLeaves ?? []} title="승인된 연차 현황" />
					</CardContent>
				</Card>
			</Box>
		</Box>
	);
}
