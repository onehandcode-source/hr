'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
	Box,
	Typography,
	Card,
	CardContent,
	Grid,
	TextField,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Chip,
	IconButton,
	Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from 'dayjs';

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
		queryKey: ['evaluation-items', 'active'],
		queryFn: async () => {
			const res = await fetch('/api/evaluation-items?isActive=true');
			if (!res.ok) throw new Error('Failed to fetch items');
			return res.json() as Promise<EvaluationItem[]>;
		},
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
		onError: (err: Error) => {
			toast.error(err.message);
		},
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

		createMutation.mutate({
			userId: selectedUserId,
			period,
			scores: scoreArray,
			comment,
		});
	};

	const handleScoreChange = (itemId: string, score: number) => {
		setScores((prev) => ({
			...prev,
			[itemId]: {
				...prev[itemId],
				score,
			},
		}));
	};

	const handleScoreCommentChange = (itemId: string, comment: string) => {
		setScores((prev) => ({
			...prev,
			[itemId]: {
				...prev[itemId],
				comment,
			},
		}));
	};

	const groupedItems = items?.reduce(
		(acc, item) => {
			if (!acc[item.category]) {
				acc[item.category] = [];
			}
			acc[item.category].push(item);
			return acc;
		},
		{} as Record<string, EvaluationItem[]>,
	);

	return (
		<Box>
			<Typography variant="h4" component="h1" gutterBottom>
				직원 평가
			</Typography>

			{/* 기존 평가 목록 */}
			<Card sx={{ mb: 4 }}>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						평가 목록
					</Typography>
					<Divider sx={{ mb: 2 }} />
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>직원명</TableCell>
									<TableCell>부서 / 직급</TableCell>
									<TableCell>평가 기간</TableCell>
									<TableCell align="center">총점</TableCell>
									<TableCell align="center">상태</TableCell>
									<TableCell>작성일</TableCell>
									<TableCell align="center">보기</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{!evaluations || evaluations.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} align="center">
											작성된 평가가 없습니다.
										</TableCell>
									</TableRow>
								) : (
									evaluations.map((ev) => (
										<TableRow key={ev.id} hover>
											<TableCell>{ev.user.name}</TableCell>
											<TableCell>
												{ev.user.department} / {ev.user.position}
											</TableCell>
											<TableCell>{ev.period}</TableCell>
											<TableCell align="center">
												<Typography fontWeight="bold" color="primary">
													{ev.totalScore.toFixed(2)}
												</Typography>
											</TableCell>
											<TableCell align="center">
												<Chip
													label={ev.status === 'COMPLETED' ? '완료' : '임시저장'}
													color={ev.status === 'COMPLETED' ? 'success' : 'default'}
													size="small"
												/>
											</TableCell>
											<TableCell>{dayjs(ev.createdAt).format('YYYY-MM-DD')}</TableCell>
											<TableCell align="center">
												<IconButton
													size="small"
													color="primary"
													onClick={() => router.push(`/admin/evaluations/${ev.id}`)}
												>
													<VisibilityIcon fontSize="small" />
												</IconButton>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>

			{/* 새 평가 작성 */}
			<Card>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						새 평가 작성
					</Typography>
					<Divider sx={{ mb: 2 }} />
					<form onSubmit={handleSubmit}>
						<Grid container spacing={3}>
							<Grid size={{ xs: 12, md: 6 }}>
								<FormControl fullWidth required>
									<InputLabel>직원 선택</InputLabel>
									<Select
										value={selectedUserId}
										label="직원 선택"
										onChange={(e) => setSelectedUserId(e.target.value)}
									>
										{users?.map((user) => (
											<MenuItem key={user.id} value={user.id}>
												{user.name} ({user.department} / {user.position})
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>

							<Grid size={{ xs: 12, md: 6 }}>
								<TextField
									label="평가 기간"
									fullWidth
									required
									value={period}
									onChange={(e) => setPeriod(e.target.value)}
									placeholder="예: 2024-Q1, 2024-H1"
								/>
							</Grid>

							{selectedUserId && (
								<>
									{Object.entries(groupedItems || {}).map(([category, categoryItems]) => (
										<Grid size={12} key={category}>
											<Typography variant="h6" gutterBottom>
												{category}
											</Typography>
											<TableContainer>
												<Table>
													<TableHead>
														<TableRow>
															<TableCell>항목</TableCell>
															<TableCell>설명</TableCell>
															<TableCell width="150px">
																점수 (최대 {categoryItems[0]?.maxScore})
															</TableCell>
															<TableCell>코멘트</TableCell>
														</TableRow>
													</TableHead>
													<TableBody>
														{categoryItems.map((item) => (
															<TableRow key={item.id}>
																<TableCell>{item.title}</TableCell>
																<TableCell>{item.description}</TableCell>
																<TableCell>
																	<TextField
																		type="number"
																		size="small"
																		slotProps={{
																			htmlInput: { min: 0, max: item.maxScore, step: 0.5 },
																		}}
																		value={scores[item.id]?.score || ''}
																		onChange={(e) =>
																			handleScoreChange(item.id, parseFloat(e.target.value))
																		}
																	/>
																</TableCell>
																<TableCell>
																	<TextField
																		size="small"
																		fullWidth
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
											</TableContainer>
										</Grid>
									))}

									<Grid size={12}>
										<TextField
											label="종합 코멘트"
											fullWidth
											multiline
											rows={4}
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
									</Grid>
								</>
							)}

							<Grid size={12}>
								<Button
									type="submit"
									variant="contained"
									size="large"
									disabled={createMutation.isPending}
								>
									{createMutation.isPending ? '저장 중...' : '평가 저장'}
								</Button>
							</Grid>
						</Grid>
					</form>
				</CardContent>
			</Card>
		</Box>
	);
}
