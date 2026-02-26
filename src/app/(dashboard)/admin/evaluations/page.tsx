'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import dayjs from 'dayjs';
import PageTransition from '@/components/common/PageTransition';

interface User {
	id: string;
	name: string;
	email: string;
	department: string;
	position: string;
}

interface EvaluationItem {
	id: string;
	title: string;
	description: string;
	category: string;
	maxScore: number;
	weight: number;
}

interface EvaluationSummary {
	id: string;
	period: string;
	status: string;
	totalScore: number;
	createdAt: string;
	user: {
		name: string;
		department: string;
		position: string;
	};
}

export default function AdminEvaluationsPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [selectedUserId, setSelectedUserId] = useState('');
	const [period, setPeriod] = useState('');
	const [comment, setComment] = useState('');
	const [scores, setScores] = useState<Record<string, { score: number; comment: string }>>({});

	const { data: users } = useQuery({
		queryKey: ['users'],
		queryFn: async () => {
			const res = await fetch('/api/users');
			if (!res.ok) throw new Error('Failed to fetch users');
			return res.json() as Promise<User[]>;
		},
	});

	const { data: items } = useQuery({
		queryKey: ['evaluation-items', selectedUserId],
		queryFn: async () => {
			const res = await fetch(`/api/evaluation-items?userId=${selectedUserId}&isActive=true`);
			if (!res.ok) throw new Error('Failed to fetch items');
			return res.json() as Promise<EvaluationItem[]>;
		},
		enabled: !!selectedUserId,
	});

	const { data: evaluations } = useQuery({
		queryKey: ['evaluations'],
		queryFn: async () => {
			const res = await fetch('/api/evaluations');
			if (!res.ok) throw new Error('Failed to fetch evaluations');
			return res.json() as Promise<EvaluationSummary[]>;
		},
	});

	const createMutation = useMutation({
		mutationFn: async (data: any) => {
			const res = await fetch('/api/evaluations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Failed to create evaluation');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['evaluations'] });
			toast.success('평가가 성공적으로 저장되었습니다.');
			setSelectedUserId('');
			setPeriod('');
			setComment('');
			setScores({});
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!selectedUserId || !period) {
			toast.error('직원과 평가 기간을 선택해주세요.');
			return;
		}

		if (Object.keys(scores).length === 0) {
			toast.error('최소 하나의 항목에 점수를 입력해주세요.');
			return;
		}

		const scoreArray = Object.entries(scores).map(([itemId, data]) => ({
			itemId,
			score: data.score,
			comment: data.comment,
		}));

		createMutation.mutate({ userId: selectedUserId, period, scores: scoreArray, comment });
	};

	const handleScoreChange = (itemId: string, score: number) => {
		setScores((prev) => ({ ...prev, [itemId]: { ...prev[itemId], score } }));
	};

	const handleScoreCommentChange = (itemId: string, c: string) => {
		setScores((prev) => ({ ...prev, [itemId]: { ...prev[itemId], comment: c } }));
	};

	const groupedItems = items?.reduce(
		(acc, item) => {
			if (!acc[item.category]) acc[item.category] = [];
			acc[item.category].push(item);
			return acc;
		},
		{} as Record<string, EvaluationItem[]>,
	);

	return (
		<PageTransition>
			<div>
				<h1 className="text-2xl font-bold mb-4">직원 평가</h1>

				{/* 평가 목록 */}
				<Card className="mb-6">
					<CardContent className="p-4">
						<h2 className="text-base font-semibold mb-3">평가 목록</h2>
						<Separator className="mb-3" />
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>직원명</TableHead>
									<TableHead className="hidden sm:table-cell">부서 / 직급</TableHead>
									<TableHead>평가 기간</TableHead>
									<TableHead className="text-center">총점</TableHead>
									<TableHead className="text-center">상태</TableHead>
									<TableHead className="hidden sm:table-cell">작성일</TableHead>
									<TableHead className="text-center">보기</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{!evaluations || evaluations.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center text-muted-foreground">
											작성된 평가가 없습니다.
										</TableCell>
									</TableRow>
								) : (
									evaluations.map((ev) => (
										<TableRow key={ev.id}>
											<TableCell>{ev.user.name}</TableCell>
											<TableCell className="hidden sm:table-cell">
												{ev.user.department} / {ev.user.position}
											</TableCell>
											<TableCell>{ev.period}</TableCell>
											<TableCell className="text-center">
												<span className="font-bold text-primary">{ev.totalScore.toFixed(2)}</span>
											</TableCell>
											<TableCell className="text-center">
												<Badge
													className={
														ev.status === 'COMPLETED'
															? 'bg-green-100 text-green-800 hover:bg-green-100'
															: 'bg-slate-100 text-slate-600 hover:bg-slate-100'
													}
												>
													{ev.status === 'COMPLETED' ? '완료' : '임시저장'}
												</Badge>
											</TableCell>
											<TableCell className="hidden sm:table-cell">
												{dayjs(ev.createdAt).format('YYYY-MM-DD')}
											</TableCell>
											<TableCell className="text-center">
												<Button
													size="icon"
													variant="ghost"
													className="h-7 w-7 text-primary"
													onClick={() => router.push(`/admin/evaluations/${ev.id}`)}
												>
													<Eye className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* 새 평가 작성 */}
				<Card>
					<CardContent className="p-4">
						<h2 className="text-base font-semibold mb-3">새 평가 작성</h2>
						<Separator className="mb-4" />
						<form onSubmit={handleSubmit} className="flex flex-col gap-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<Label>직원 선택 *</Label>
									<Select
										value={selectedUserId}
										onValueChange={(v) => {
											setSelectedUserId(v);
											setScores({});
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="직원을 선택하세요" />
										</SelectTrigger>
										<SelectContent>
											{users?.map((user) => (
												<SelectItem key={user.id} value={user.id}>
													{user.name} ({user.department} / {user.position})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="evalPeriod">평가 기간 *</Label>
									<Input
										id="evalPeriod"
										value={period}
										onChange={(e) => setPeriod(e.target.value)}
										placeholder="예: 2024-Q1, 2024-H1"
									/>
								</div>
							</div>

							{/* 평가 항목 없음 안내 */}
							{selectedUserId && items?.length === 0 && (
								<div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
									이 직원의 평가 항목이 없습니다.{' '}
									<a href="/admin/evaluations/items" className="underline font-medium">
										평가 항목 관리
									</a>
									에서 먼저 항목을 추가해주세요.
								</div>
							)}

							{/* 평가 항목 있음 */}
							{selectedUserId && items && items.length > 0 && (
								<>
									{Object.entries(groupedItems || {}).map(([category, categoryItems]) => (
										<div key={category}>
											<h3 className="text-base font-semibold mb-2">{category}</h3>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>항목</TableHead>
														<TableHead className="hidden md:table-cell">설명</TableHead>
														<TableHead className="w-40">
															점수 (최대 {categoryItems[0]?.maxScore})
														</TableHead>
														<TableHead>코멘트</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{categoryItems.map((item) => (
														<TableRow key={item.id}>
															<TableCell>{item.title}</TableCell>
															<TableCell className="hidden md:table-cell">
																{item.description}
															</TableCell>
															<TableCell>
																<Input
																	type="number"
																	className="w-24"
																	min={0}
																	max={item.maxScore}
																	step={0.5}
																	value={scores[item.id]?.score || ''}
																	onChange={(e) =>
																		handleScoreChange(item.id, parseFloat(e.target.value))
																	}
																/>
															</TableCell>
															<TableCell>
																<Input
																	placeholder="선택사항"
																	value={scores[item.id]?.comment || ''}
																	onChange={(e) =>
																		handleScoreCommentChange(item.id, e.target.value)
																	}
																/>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									))}

									<div className="space-y-1.5">
										<Label htmlFor="evalComment">종합 코멘트</Label>
										<Textarea
											id="evalComment"
											rows={4}
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
									</div>
								</>
							)}

							<Button type="submit" size="lg" disabled={createMutation.isPending} className="self-start">
								{createMutation.isPending ? '저장 중...' : '평가 저장'}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
