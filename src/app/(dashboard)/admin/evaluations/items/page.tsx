'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ListChecks, UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import PageTransition from '@/components/common/PageTransition';
import Loading from '@/components/common/Loading';

interface User {
	id: string;
	name: string;
	department: string | null;
	position: string | null;
}

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

const emptyForm = { title: '', description: '', category: '', maxScore: 5, weight: 1.0, order: 0 };

export default function EvaluationItemsPage() {
	const queryClient = useQueryClient();
	const [selectedUserId, setSelectedUserId] = useState('');
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<EvaluationItem | null>(null);
	const [formData, setFormData] = useState(emptyForm);

	const { data: users } = useQuery<User[]>({
		queryKey: ['users'],
		queryFn: async () => {
			const res = await fetch('/api/users');
			if (!res.ok) throw new Error('Failed to fetch users');
			return res.json();
		},
	});

	const { data: items, isLoading } = useQuery<EvaluationItem[]>({
		queryKey: ['evaluation-items', selectedUserId],
		queryFn: async () => {
			const res = await fetch(`/api/evaluation-items?userId=${selectedUserId}`);
			if (!res.ok) throw new Error('Failed to fetch items');
			return res.json();
		},
		enabled: !!selectedUserId,
	});

	const createMutation = useMutation({
		mutationFn: async (data: typeof emptyForm) => {
			const res = await fetch('/api/evaluation-items', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...data, userId: selectedUserId }),
			});
			if (!res.ok) throw new Error('Failed to create item');
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['evaluation-items', selectedUserId] });
			toast.success('항목이 추가되었습니다.');
			handleCloseDialog();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<typeof emptyForm & { isActive: boolean }> }) => {
			const res = await fetch(`/api/evaluation-items/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!res.ok) throw new Error('Failed to update item');
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['evaluation-items', selectedUserId] });
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
			queryClient.invalidateQueries({ queryKey: ['evaluation-items', selectedUserId] });
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
			setFormData(emptyForm);
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		setEditingItem(null);
	};

	const handleSubmit = () => {
		if (!formData.title || !formData.category) {
			toast.error('항목명과 카테고리는 필수입니다.');
			return;
		}
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

	const selectedUser = users?.find((u) => u.id === selectedUserId);

	return (
		<PageTransition>
			<div>
				<div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-6">
					<div>
						<h1 className="text-2xl font-bold">평가 항목 관리</h1>
						<p className="text-sm text-muted-foreground mt-0.5">직원별 평가 항목을 설정하세요</p>
					</div>
					{selectedUserId && (
						<Button onClick={() => handleOpenDialog()} className="sm:mt-1">
							<Plus className="h-4 w-4 mr-1" />
							항목 추가
						</Button>
					)}
				</div>

				{/* 직원 선택 */}
				<Card className="mb-4">
					<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
						<div className="p-1.5 rounded-md bg-primary/10">
							<UserSearch className="h-4 w-4 text-primary" />
						</div>
						<CardTitle className="text-sm font-semibold">직원 선택</CardTitle>
					</CardHeader>
					<CardContent className="p-5">
						<Select value={selectedUserId} onValueChange={setSelectedUserId}>
							<SelectTrigger className="max-w-sm">
								<SelectValue placeholder="직원을 선택하세요" />
							</SelectTrigger>
							<SelectContent>
								{users?.map((user) => (
									<SelectItem key={user.id} value={user.id}>
										{user.name}
										{user.department
											? ` (${user.department}${user.position ? ' / ' + user.position : ''})`
											: ''}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</CardContent>
				</Card>

				{/* 항목 목록 */}
				{!selectedUserId ? (
					<Card>
						<CardContent className="p-8 text-center text-sm text-muted-foreground">
							직원을 선택하면 해당 직원의 평가 항목을 관리할 수 있습니다.
						</CardContent>
					</Card>
				) : isLoading ? (
					<Loading />
				) : !items || items.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center text-sm text-muted-foreground">
							{selectedUser?.name}의 평가 항목이 없습니다. 우측 상단 &apos;항목 추가&apos; 버튼으로 추가해주세요.
						</CardContent>
					</Card>
				) : (
					Object.entries(groupedItems || {}).map(([category, categoryItems]) => (
						<Card key={category} className="mb-3">
							<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
								<div className="p-1.5 rounded-md bg-primary/10">
									<ListChecks className="h-4 w-4 text-primary" />
								</div>
								<CardTitle className="text-sm font-semibold">{category}</CardTitle>
								<Badge variant="outline" className="ml-auto text-xs">
									{categoryItems.length}개 항목
								</Badge>
							</CardHeader>
							<CardContent className="p-0">
								<Table>
									<TableHeader>
										<TableRow className="bg-muted/40 hover:bg-muted/40">
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
												<TableCell className="font-medium">{item.title}</TableCell>
												<TableCell className="hidden md:table-cell text-muted-foreground text-sm">
													{item.description}
												</TableCell>
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
					))
				)}

				<Dialog open={dialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>
								{editingItem ? '평가 항목 수정' : `${selectedUser?.name} · 평가 항목 추가`}
							</DialogTitle>
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
