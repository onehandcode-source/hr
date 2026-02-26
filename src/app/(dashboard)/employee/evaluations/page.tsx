'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import PageTransition from '@/components/common/PageTransition';

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
		return <p className="text-muted-foreground">로딩 중...</p>;
	}

	if (!evaluations || evaluations.length === 0) {
		return (
			<PageTransition>
				<div>
					<h1 className="text-2xl font-bold mb-4">내 평가</h1>
					<Card className="mt-2">
						<CardContent className="p-6">
							<p className="text-sm text-muted-foreground">평가 결과가 없습니다.</p>
						</CardContent>
					</Card>
				</div>
			</PageTransition>
		);
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
				<h1 className="text-2xl font-bold mb-4">내 평가</h1>

				{evaluations.map((evaluation) => (
					<Card key={evaluation.id} className="mb-4">
						<CardContent className="p-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-base font-semibold">{evaluation.period} 평가</h2>
								<Badge className="bg-primary text-primary-foreground">
									총점: {evaluation.totalScore?.toFixed(2) || 'N/A'}
								</Badge>
							</div>

							{Object.entries(groupScoresByCategory(evaluation.scores)).map(
								([category, categoryScores]) => (
									<div key={category} className="mb-5">
										<h3 className="text-sm font-bold mb-2">{category}</h3>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>항목</TableHead>
													<TableHead>점수</TableHead>
													<TableHead>코멘트</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{categoryScores.map((score, idx) => (
													<TableRow key={idx}>
														<TableCell>{score.item.title}</TableCell>
														<TableCell>
															{score.score} / {score.item.maxScore}
														</TableCell>
														<TableCell>{score.comment || '-'}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								),
							)}

							{evaluation.comment && (
								<>
									<Separator className="my-3" />
									<h3 className="text-sm font-bold mb-1">종합 코멘트</h3>
									<p className="text-sm text-muted-foreground">{evaluation.comment}</p>
								</>
							)}

							<p className="text-xs text-muted-foreground mt-3">
								평가일: {new Date(evaluation.createdAt).toLocaleDateString('ko-KR')}
							</p>
						</CardContent>
					</Card>
				))}
			</div>
		</PageTransition>
	);
}
