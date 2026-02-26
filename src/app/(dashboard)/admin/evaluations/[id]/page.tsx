'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import dayjs from 'dayjs';
import PageTransition from '@/components/common/PageTransition';

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

	if (isLoading) return <p className="text-muted-foreground">로딩 중...</p>;
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
				<div className="flex items-center gap-2 mb-5">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push('/admin/evaluations')}
					>
						<ArrowLeft className="h-4 w-4 mr-1" />
						목록으로
					</Button>
					<h1 className="text-2xl font-bold">평가 상세</h1>
				</div>

				{/* 기본 정보 */}
				<Card className="mb-4">
					<CardContent className="p-6">
						<h2 className="text-base font-semibold mb-3">기본 정보</h2>
						<Separator className="mb-4" />
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
										<span className="font-bold text-primary">
											{evaluation.totalScore.toFixed(2)}점
										</span>
									),
								},
								{
									label: '상태',
									value: (
										<Badge
											className={
												evaluation.status === 'COMPLETED'
													? 'bg-green-100 text-green-800 hover:bg-green-100'
													: 'bg-slate-100 text-slate-600 hover:bg-slate-100'
											}
										>
											{evaluation.status === 'COMPLETED' ? '완료' : '임시저장'}
										</Badge>
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
						<CardContent className="p-4">
							<h2 className="text-base font-semibold mb-3">{category}</h2>
							<Table>
								<TableHeader>
									<TableRow>
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
											<TableCell>{s.item.title}</TableCell>
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
						<CardContent className="p-6">
							<h2 className="text-base font-semibold mb-3">종합 코멘트</h2>
							<Separator className="mb-3" />
							<p className="text-sm whitespace-pre-wrap">{evaluation.comment}</p>
						</CardContent>
					</Card>
				)}
			</div>
		</PageTransition>
	);
}
