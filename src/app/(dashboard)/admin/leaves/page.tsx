'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/useIsMobile';
import { formatDateKorean } from '@/lib/utils/date';
import PageTransition from '@/components/common/PageTransition';

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
};
const statusText: Record<string, string> = {
	PENDING: '대기중',
	APPROVED: '승인',
	REJECTED: '거부',
};

interface LeaveRequest {
	id: string;
	startDate: string;
	endDate: string;
	days: number;
	reason: string;
	status: string;
	leaveType: string;
	createdAt: string;
	user: {
		name: string;
		department: string;
		position: string;
	};
	reviewNote?: string;
}

export default function AdminLeavesPage() {
	const queryClient = useQueryClient();
	const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
	const [reviewNote, setReviewNote] = useState('');
	const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);

	const isMobile = useIsMobile();

	const {
		data: leaves,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['leaves', 'admin'],
		queryFn: async () => {
			const res = await fetch('/api/leaves?status=PENDING');
			if (!res.ok) throw new Error('Failed to fetch leaves');
			return res.json() as Promise<LeaveRequest[]>;
		},
	});

	useEffect(() => {
		if (error) toast.error('데이터를 불러오는데 실패했습니다.');
	}, [error]);

	const updateMutation = useMutation({
		mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
			const res = await fetch(`/api/leaves/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status, reviewNote: note }),
			});
			if (!res.ok) throw new Error('Failed to update leave');
			return res.json();
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['leaves'] });
			toast.success(
				variables.status === 'APPROVED' ? '연차가 승인되었습니다.' : '연차가 거부되었습니다.',
			);
			handleCloseDialog();
		},
		onError: (err: Error) => {
			toast.error(err.message);
		},
	});

	const handleOpenDialog = (leave: LeaveRequest, action: 'APPROVED' | 'REJECTED') => {
		setSelectedLeave(leave);
		setActionType(action);
		setReviewNote('');
	};

	const handleCloseDialog = () => {
		setSelectedLeave(null);
		setActionType(null);
		setReviewNote('');
	};

	const handleSubmit = () => {
		if (!selectedLeave || !actionType) return;
		updateMutation.mutate({ id: selectedLeave.id, status: actionType, note: reviewNote });
	};

	if (isLoading) {
		return <p className="text-muted-foreground">로딩 중...</p>;
	}

	return (
		<PageTransition>
			<div>
				<h1 className="text-2xl font-bold mb-4">연차 관리</h1>

				{/* 모바일: 카드 레이아웃 */}
				{isMobile ? (
					<div className="flex flex-col gap-3 mt-2">
						{!leaves || leaves.length === 0 ? (
							<p className="text-center text-muted-foreground py-6">
								대기 중인 연차 신청이 없습니다.
							</p>
						) : (
							leaves.map((leave) => (
								<Card key={leave.id}>
									<CardContent className="p-4">
										<div className="flex justify-between items-start mb-2">
											<div>
												<p className="font-semibold">{leave.user.name}</p>
												<p className="text-sm text-muted-foreground">
													{leave.user.department} · {leave.user.position}
												</p>
											</div>
											<Badge className={statusClass[leave.status] ?? ''}>
												{statusText[leave.status] ?? leave.status}
											</Badge>
										</div>
										<div className="flex gap-2 flex-wrap items-center mb-1">
											<Badge variant="outline">
												{LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
											</Badge>
											<span className="text-sm">
												{formatDateKorean(new Date(leave.startDate))} ~{' '}
												{formatDateKorean(new Date(leave.endDate))} ({leave.days}일)
											</span>
										</div>
										{leave.reason && (
											<p className="text-xs text-muted-foreground mb-2">사유: {leave.reason}</p>
										)}
										{leave.status === 'PENDING' && (
											<div className="flex gap-2 mt-2">
												<Button
													size="sm"
													className="flex-1 bg-green-600 hover:bg-green-700"
													onClick={() => handleOpenDialog(leave, 'APPROVED')}
												>
													승인
												</Button>
												<Button
													size="sm"
													variant="destructive"
													className="flex-1"
													onClick={() => handleOpenDialog(leave, 'REJECTED')}
												>
													거부
												</Button>
											</div>
										)}
									</CardContent>
								</Card>
							))
						)}
					</div>
				) : (
					/* 데스크탑: 테이블 */
					<Card className="mt-2">
						<CardContent className="p-4">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>직원명</TableHead>
										<TableHead>부서/직급</TableHead>
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
									{!leaves || leaves.length === 0 ? (
										<TableRow>
											<TableCell colSpan={9} className="text-center text-muted-foreground">
												대기 중인 연차 신청이 없습니다.
											</TableCell>
										</TableRow>
									) : (
										leaves.map((leave) => (
											<TableRow key={leave.id}>
												<TableCell>{leave.user.name}</TableCell>
												<TableCell>
													{leave.user.department} / {leave.user.position}
												</TableCell>
												<TableCell>{LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}</TableCell>
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
														<div className="flex gap-1">
															<Button
																size="sm"
																className="bg-green-600 hover:bg-green-700 text-white"
																onClick={() => handleOpenDialog(leave, 'APPROVED')}
															>
																승인
															</Button>
															<Button
																size="sm"
																variant="destructive"
																onClick={() => handleOpenDialog(leave, 'REJECTED')}
															>
																거부
															</Button>
														</div>
													)}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}

				<Dialog open={!!selectedLeave} onOpenChange={(open) => !open && handleCloseDialog()}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>연차 {actionType === 'APPROVED' ? '승인' : '거부'}</DialogTitle>
						</DialogHeader>
						<div className="space-y-1.5 py-2">
							<Label htmlFor="reviewNote">메모 (선택사항)</Label>
							<Textarea
								id="reviewNote"
								rows={3}
								value={reviewNote}
								onChange={(e) => setReviewNote(e.target.value)}
							/>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={handleCloseDialog}>
								취소
							</Button>
							<Button onClick={handleSubmit} disabled={updateMutation.isPending}>
								확인
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PageTransition>
	);
}
