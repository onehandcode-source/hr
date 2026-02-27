'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, User, ListChecks, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import dayjs from 'dayjs';
import PageTransition from '@/components/common/PageTransition';
import Loading from '@/components/common/Loading';

interface EvaluationScore {
	id: string;
	score: number;
	comment?: string;
	item: {
		id: string;
		title: string;
		description?: string;
		category: string;
		maxScore: number;
		weight: number;
	};
}

interface Evaluation {
	id: string;
	period: string;
	status: string;
	totalScore: number;
	comment?: string;
	createdAt: string;
	user: {
		name: string;
		email: string;
		department: string;
		position: string;
	};
	scores: EvaluationScore[];
}

export default function EvaluationDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const {
		data: evaluation,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['evaluation', id],
		queryFn: async () => {
			const res = await fetch(`/api/evaluations/${id}`);
			if (!res.ok) throw new Error('Failed to fetch evaluation');
			return res.json() as Promise<Evaluation>;
		},
	});

	useEffect(() => {
		if (error) toast.error('평가 데이터를 불러오는데 실패했습니다.');
	}, [error]);

	if (isLoading) return <Loading />;
	if (!evaluation) return null;

	const groupedScores = evaluation.scores.reduce(
		(acc, score) => {
			const cat = score.item.category;
			if (!acc[cat]) acc[cat] = [];
			acc[cat].push(score);
			return acc;
		},
		{} as Record<string, EvaluationScore[]>,
	);

	return (
		<PageTransition>
			<div>
				<div className="flex items-center gap-3 mb-6">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push('/admin/evaluations')}
					>
						<ArrowLeft className="h-4 w-4 mr-1" />
						목록으로
					</Button>
					<div>
						<h1 className="text-2xl font-bold">평가 상세</h1>
						<p className="text-sm text-muted-foreground mt-0.5">{evaluation.user.name} · {evaluation.period}</p>
					</div>
				</div>

				{/* 기본 정보 */}
				<Card className="mb-4">
					<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
						<div className="p-1.5 rounded-md bg-primary/10">
							<User className="h-4 w-4 text-primary" />
						</div>
						<CardTitle className="text-sm font-semibold">기본 정보</CardTitle>
						<Badge
							className={`ml-auto ${
								evaluation.status === 'COMPLETED'
									? 'bg-green-100 text-green-800 hover:bg-green-100'
									: 'bg-slate-100 text-slate-600 hover:bg-slate-100'
							}`}
						>
							{evaluation.status === 'COMPLETED' ? '완료' : '임시저장'}
						</Badge>
					</CardHeader>
					<CardContent className="p-5">
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							{[
								{ label: '직원명', value: evaluation.user.name },
								{
									label: '부서 / 직급',
									value: `${evaluation.user.department} / ${evaluation.user.position}`,
								},
								{ label: '평가 기간', value: evaluation.period },
								{
									label: '총점',
									value: (
										<span className="font-bold text-primary text-lg">
											{evaluation.totalScore.toFixed(2)}점
										</span>
									),
								},
								{
									label: '작성일',
									value: dayjs(evaluation.createdAt).format('YYYY년 MM월 DD일'),
								},
							].map(({ label, value }) => (
								<div key={label}>
									<p className="text-xs text-muted-foreground mb-1">{label}</p>
									<div className="text-sm font-medium">{value}</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* 항목별 점수 */}
				{Object.entries(groupedScores).map(([category, scores]) => (
					<Card key={category} className="mb-3">
						<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
							<div className="p-1.5 rounded-md bg-primary/10">
								<ListChecks className="h-4 w-4 text-primary" />
							</div>
							<CardTitle className="text-sm font-semibold">{category}</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40 hover:bg-muted/40">
										<TableHead>항목</TableHead>
										<TableHead>설명</TableHead>
										<TableHead className="text-center">점수</TableHead>
										<TableHead className="text-center">가중치</TableHead>
										<TableHead>코멘트</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{scores.map((s) => (
										<TableRow key={s.id}>
											<TableCell className="font-medium">{s.item.title}</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{s.item.description}
											</TableCell>
											<TableCell className="text-center">
												<Badge
													variant="outline"
													className={
														s.score >= s.item.maxScore * 0.8
															? 'border-green-500 text-green-700'
															: s.score >= s.item.maxScore * 0.5
																? 'border-yellow-500 text-yellow-700'
																: 'border-red-500 text-red-700'
													}
												>
													{s.score} / {s.item.maxScore}
												</Badge>
											</TableCell>
											<TableCell className="text-center">{s.item.weight}</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{s.comment || '-'}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				))}

				{/* 종합 코멘트 */}
				{evaluation.comment && (
					<Card>
						<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
							<div className="p-1.5 rounded-md bg-violet-50">
								<MessageSquare className="h-4 w-4 text-violet-600" />
							</div>
							<CardTitle className="text-sm font-semibold">종합 코멘트</CardTitle>
						</CardHeader>
						<CardContent className="p-5">
							<p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
								{evaluation.comment}
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</PageTransition>
	);
}
