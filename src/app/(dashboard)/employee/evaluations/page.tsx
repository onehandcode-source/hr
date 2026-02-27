'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Star, ListChecks, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import PageTransition from '@/components/common/PageTransition';
import Loading from '@/components/common/Loading';

interface Evaluation {
	id: string;
	period: string;
	status: string;
	totalScore: number;
	comment: string;
	createdAt: string;
	scores: Array<{
		score: number;
		comment: string;
		item: {
			title: string;
			category: string;
			maxScore: number;
			weight: number;
		};
	}>;
}

export default function EmployeeEvaluationsPage() {
	const { data: session } = useSession();

	const {
		data: evaluations,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['evaluations', 'my'],
		queryFn: async () => {
			const res = await fetch('/api/evaluations');
			if (!res.ok) throw new Error('Failed to fetch evaluations');
			return res.json() as Promise<Evaluation[]>;
		},
		enabled: !!session?.user?.id,
	});

	useEffect(() => {
		if (error) toast.error('데이터를 불러오는데 실패했습니다.');
	}, [error]);

	if (isLoading) {
		return <Loading />;
	}

	const groupScoresByCategory = (scores: Evaluation['scores']) => {
		return scores.reduce(
			(acc, score) => {
				const category = score.item.category;
				if (!acc[category]) acc[category] = [];
				acc[category].push(score);
				return acc;
			},
			{} as Record<string, typeof scores>,
		);
	};

	return (
		<PageTransition>
			<div>
				<div className="mb-6">
					<h1 className="text-2xl font-bold">내 평가</h1>
					<p className="text-sm text-muted-foreground mt-0.5">나의 성과 평가 결과를 확인하세요</p>
				</div>

				{!evaluations || evaluations.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center text-sm text-muted-foreground">
							평가 결과가 없습니다.
						</CardContent>
					</Card>
				) : (
					evaluations.map((evaluation) => (
						<div key={evaluation.id} className="mb-6">
							{/* 평가 헤더 카드 */}
							<Card className="overflow-hidden mb-3">
								<div className="h-1 bg-violet-500" />
								<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
									<div className="p-1.5 rounded-md bg-violet-50">
										<Star className="h-4 w-4 text-violet-600" />
									</div>
									<CardTitle className="text-sm font-semibold">{evaluation.period} 평가</CardTitle>
									<div className="ml-auto flex items-center gap-2">
										<Badge
											className={
												evaluation.status === 'COMPLETED'
													? 'bg-green-100 text-green-800 hover:bg-green-100'
													: 'bg-slate-100 text-slate-600 hover:bg-slate-100'
											}
										>
											{evaluation.status === 'COMPLETED' ? '완료' : '임시저장'}
										</Badge>
										<span className="text-lg font-bold text-primary">
											{evaluation.totalScore?.toFixed(2) || 'N/A'}점
										</span>
									</div>
								</CardHeader>
								<CardContent className="px-5 py-3">
									<p className="text-xs text-muted-foreground">
										평가일: {new Date(evaluation.createdAt).toLocaleDateString('ko-KR')}
									</p>
								</CardContent>
							</Card>

							{/* 카테고리별 점수 */}
							{Object.entries(groupScoresByCategory(evaluation.scores)).map(
								([category, categoryScores]) => (
									<Card key={category} className="mb-3">
										<CardHeader className="flex flex-row items-center gap-2 px-5 py-3 border-b space-y-0">
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
														<TableHead>점수</TableHead>
														<TableHead>코멘트</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{categoryScores.map((score, idx) => (
														<TableRow key={idx}>
															<TableCell className="font-medium">{score.item.title}</TableCell>
															<TableCell>
																<Badge
																	variant="outline"
																	className={
																		score.score >= score.item.maxScore * 0.8
																			? 'border-green-500 text-green-700'
																			: score.score >= score.item.maxScore * 0.5
																				? 'border-yellow-500 text-yellow-700'
																				: 'border-red-500 text-red-700'
																	}
																>
																	{score.score} / {score.item.maxScore}
																</Badge>
															</TableCell>
															<TableCell className="text-muted-foreground text-sm">
																{score.comment || '-'}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</CardContent>
									</Card>
								),
							)}

							{/* 종합 코멘트 */}
							{evaluation.comment && (
								<Card>
									<CardHeader className="flex flex-row items-center gap-2 px-5 py-3 border-b space-y-0">
										<div className="p-1.5 rounded-md bg-violet-50">
											<MessageSquare className="h-4 w-4 text-violet-600" />
										</div>
										<CardTitle className="text-sm font-semibold">종합 코멘트</CardTitle>
									</CardHeader>
									<CardContent className="p-5">
										<p className="text-sm text-muted-foreground leading-relaxed">
											{evaluation.comment}
										</p>
									</CardContent>
								</Card>
							)}
						</div>
					))
				)}
			</div>
		</PageTransition>
	);
}
