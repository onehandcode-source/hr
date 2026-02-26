'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import PageTransition from '@/components/common/PageTransition';

interface EvaluationItem {
	id: string;
	title: string;
	description: string;
	category: string;
	maxScore: number;
	weight: number;
	order: number;
	isActive: boolean;
}

export default function EvaluationItemsPage() {
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<EvaluationItem | null>(null);
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		category: '',
		maxScore: 5,
		weight: 1.0,
		order: 0,
	});

	const {
		data: items,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['evaluation-items'],
		queryFn: async () => {
			const res = await fetch('/api/evaluation-items');
			if (!res.ok) throw new Error('Failed to fetch items');
			return res.json() as Promise<EvaluationItem[]>;
		},
	});

	useEffect(() => {
		if (error) toast.error('데이터를 불러오는데 실패했습니다.');
	}, [error]);

	const createMutation = useMutation({
		mutationFn: async (data: any) => {
			const res = await fetch('/api/evaluation-items', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!res.ok) throw new Error('Failed to create item');
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['evaluation-items'] });
			toast.success('항목이 추가되었습니다.');
			handleCloseDialog();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, data }: { id: string; data: any }) => {
			const res = await fetch(`/api/evaluation-items/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!res.ok) throw new Error('Failed to update item');
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['evaluation-items'] });
			toast.success('항목이 수정되었습니다.');
			handleCloseDialog();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/evaluation-items/${id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to delete item');
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['evaluation-items'] });
			toast.success('항목이 삭제되었습니다.');
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const handleOpenDialog = (item?: EvaluationItem) => {
		if (item) {
			setEditingItem(item);
			setFormData({
				title: item.title,
				description: item.description || '',
				category: item.category,
				maxScore: item.maxScore,
				weight: item.weight,
				order: item.order,
			});
		} else {
			setEditingItem(null);
			setFormData({ title: '', description: '', category: '', maxScore: 5, weight: 1.0, order: 0 });
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingItem(null);
	};

	const handleSubmit = () => {
		if (editingItem) {
			updateMutation.mutate({ id: editingItem.id, data: formData });
		} else {
			createMutation.mutate(formData);
		}
	};

	const handleDelete = (id: string) => {
		if (confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(id);
	};

	const groupedItems = items?.reduce(
		(acc, item) => {
			if (!acc[item.category]) acc[item.category] = [];
			acc[item.category].push(item);
			return acc;
		},
		{} as Record<string, EvaluationItem[]>,
	);

	if (isLoading) return <p className="text-muted-foreground">로딩 중...</p>;

	return (
		<PageTransition>
			<div>
				<div className="flex justify-between items-center mb-4">
					<h1 className="text-2xl font-bold">평가 항목 관리</h1>
					<Button onClick={() => handleOpenDialog()}>
						<Plus className="h-4 w-4 mr-1" />
						항목 추가
					</Button>
				</div>

				{Object.entries(groupedItems || {}).map(([category, categoryItems]) => (
					<Card key={category} className="mb-3">
						<CardContent className="p-4">
							<h2 className="text-base font-semibold mb-3">{category}</h2>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>항목명</TableHead>
										<TableHead className="hidden md:table-cell">설명</TableHead>
										<TableHead>최대점수</TableHead>
										<TableHead className="hidden sm:table-cell">가중치</TableHead>
										<TableHead className="hidden sm:table-cell">순서</TableHead>
										<TableHead>상태</TableHead>
										<TableHead>작업</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{categoryItems.map((item) => (
										<TableRow key={item.id}>
											<TableCell>{item.title}</TableCell>
											<TableCell className="hidden md:table-cell">{item.description}</TableCell>
											<TableCell>{item.maxScore}</TableCell>
											<TableCell className="hidden sm:table-cell">{item.weight}</TableCell>
											<TableCell className="hidden sm:table-cell">{item.order}</TableCell>
											<TableCell>
												<Badge
													className={
														item.isActive
															? 'bg-green-100 text-green-800 hover:bg-green-100'
															: 'bg-slate-100 text-slate-600 hover:bg-slate-100'
													}
												>
													{item.isActive ? '활성' : '비활성'}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex gap-1">
													<Button
														size="icon"
														variant="ghost"
														className="h-7 w-7"
														onClick={() => handleOpenDialog(item)}
													>
														<Pencil className="h-3.5 w-3.5" />
													</Button>
													<Button
														size="icon"
														variant="ghost"
														className="h-7 w-7 text-destructive hover:text-destructive"
														onClick={() => handleDelete(item.id)}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				))}

				<Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>{editingItem ? '평가 항목 수정' : '평가 항목 추가'}</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-3 py-2">
							<div className="space-y-1.5">
								<Label htmlFor="itemTitle">항목명 *</Label>
								<Input
									id="itemTitle"
									value={formData.title}
									onChange={(e) => setFormData({ ...formData, title: e.target.value })}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="itemDesc">설명</Label>
								<Textarea
									id="itemDesc"
									rows={2}
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="itemCategory">카테고리 *</Label>
								<Input
									id="itemCategory"
									value={formData.category}
									onChange={(e) => setFormData({ ...formData, category: e.target.value })}
									placeholder="예: 업무능력, 협업능력, 태도"
								/>
							</div>
							<div className="grid grid-cols-3 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor="itemMaxScore">최대 점수</Label>
									<Input
										id="itemMaxScore"
										type="number"
										value={formData.maxScore}
										onChange={(e) =>
											setFormData({ ...formData, maxScore: parseInt(e.target.value) })
										}
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="itemWeight">가중치</Label>
									<Input
										id="itemWeight"
										type="number"
										step="0.1"
										value={formData.weight}
										onChange={(e) =>
											setFormData({ ...formData, weight: parseFloat(e.target.value) })
										}
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="itemOrder">순서</Label>
									<Input
										id="itemOrder"
										type="number"
										value={formData.order}
										onChange={(e) =>
											setFormData({ ...formData, order: parseInt(e.target.value) })
										}
									/>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={handleCloseDialog}>
								취소
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={createMutation.isPending || updateMutation.isPending}
							>
								{editingItem ? '수정' : '추가'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PageTransition>
	);
}
