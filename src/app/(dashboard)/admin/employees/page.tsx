'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import { useIsMobile } from '@/hooks/useIsMobile';
import dayjs from 'dayjs';
import PageTransition from '@/components/common/PageTransition';
import Loading from '@/components/common/Loading';

interface Employee {
	id: string;
	name: string;
	email: string;
	department: string | null;
	position: string | null;
	hireDate: string;
	totalLeaves: number;
	usedLeaves: number;
	isActive: boolean;
}

interface EmployeeForm {
	name: string;
	email: string;
	password: string;
	department: string;
	position: string;
	hireDate: string;
	totalLeaves: string;
}

const emptyForm: EmployeeForm = {
	name: '',
	email: '',
	password: '',
	department: '',
	position: '',
	hireDate: dayjs().format('YYYY-MM-DD'),
	totalLeaves: '15',
};

export default function EmployeesPage() {
	const queryClient = useQueryClient();
	const [showInactive, setShowInactive] = useState(false);
	const [addOpen, setAddOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<Employee | null>(null);
	const [form, setForm] = useState<EmployeeForm>(emptyForm);
	const [editForm, setEditForm] = useState<Partial<EmployeeForm>>({});

	const isMobile = useIsMobile();

	const { data: employees, isLoading } = useQuery<Employee[]>({
		queryKey: ['employees', showInactive],
		queryFn: async () => {
			const res = await fetch(`/api/users?includeInactive=${showInactive}`);
			if (!res.ok) throw new Error('Failed to fetch employees');
			return res.json();
		},
	});

	const createMutation = useMutation({
		mutationFn: async (data: EmployeeForm) => {
			const res = await fetch('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '생성 실패');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['employees'] });
			queryClient.invalidateQueries({ queryKey: ['statistics'] });
			toast.success('직원이 추가되었습니다.');
			setAddOpen(false);
			setForm(emptyForm);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, data }: { id: string; data: any }) => {
			const res = await fetch(`/api/users/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '수정 실패');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['employees'] });
			queryClient.invalidateQueries({ queryKey: ['statistics'] });
			toast.success('직원 정보가 수정되었습니다.');
			setEditTarget(null);
		},
		onError: (err: Error) => toast.error(err.message),
	});

	const handleAdd = () => {
		if (!form.name || !form.email || !form.password) {
			toast.error('이름, 이메일, 비밀번호는 필수입니다.');
			return;
		}
		createMutation.mutate(form);
	};

	const handleEditOpen = (emp: Employee) => {
		setEditTarget(emp);
		setEditForm({
			name: emp.name,
			department: emp.department ?? '',
			position: emp.position ?? '',
			hireDate: dayjs(emp.hireDate).format('YYYY-MM-DD'),
			totalLeaves: String(emp.totalLeaves),
		});
	};

	const handleEdit = () => {
		if (!editTarget) return;
		updateMutation.mutate({ id: editTarget.id, data: editForm });
	};

	const handleToggleActive = (emp: Employee) => {
		updateMutation.mutate({ id: emp.id, data: { isActive: !emp.isActive } });
	};

	if (isLoading) return <Loading />;

	return (
		<PageTransition>
			<div>
				<div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-6">
					<div>
						<h1 className="text-2xl font-bold">직원 관리</h1>
						<p className="text-sm text-muted-foreground mt-0.5">직원 정보를 조회하고 관리하세요</p>
					</div>
					<div className="flex items-center gap-3 sm:mt-1">
						<div className="flex items-center gap-2">
							<Switch
								id="showInactive"
								checked={showInactive}
								onCheckedChange={setShowInactive}
							/>
							<Label htmlFor="showInactive" className="text-sm">
								비활성 포함
							</Label>
						</div>
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="h-4 w-4 mr-1" />
							직원 추가
						</Button>
					</div>
				</div>

				{isMobile ? (
					/* 모바일: 카드 */
					<div className="flex flex-col gap-3">
						{!employees || employees.length === 0 ? (
							<Card>
								<CardContent className="p-8 text-center text-sm text-muted-foreground">
									직원이 없습니다.
								</CardContent>
							</Card>
						) : (
							employees.map((emp) => (
								<Card key={emp.id} className={`overflow-hidden ${emp.isActive ? '' : 'opacity-60'}`}>
									<div className={`h-1 ${emp.isActive ? 'bg-primary' : 'bg-slate-300'}`} />
									<CardContent className="p-4">
										<div className="flex justify-between items-start">
											<div>
												<p className="font-semibold">{emp.name}</p>
												<p className="text-sm text-muted-foreground">
													{emp.department || '-'} · {emp.position || '-'}
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													연차 {emp.totalLeaves}일 · 사용 {emp.usedLeaves}일 · 잔여{' '}
													{emp.totalLeaves - emp.usedLeaves}일
												</p>
											</div>
											<div className="flex flex-col items-end gap-2">
												<Badge
													className={
														emp.isActive
															? 'bg-green-100 text-green-800 hover:bg-green-100'
															: 'bg-slate-100 text-slate-600 hover:bg-slate-100'
													}
												>
													{emp.isActive ? '활성' : '비활성'}
												</Badge>
												<div className="flex items-center gap-1">
													<Button
														size="icon"
														variant="ghost"
														className="h-7 w-7"
														onClick={() => handleEditOpen(emp)}
													>
														<Pencil className="h-3.5 w-3.5" />
													</Button>
													<Switch
														checked={emp.isActive}
														onCheckedChange={() => handleToggleActive(emp)}
													/>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))
						)}
					</div>
				) : (
					/* 데스크탑: 테이블 */
					<Card>
						<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
							<div className="p-1.5 rounded-md bg-primary/10">
								<Users className="h-4 w-4 text-primary" />
							</div>
							<CardTitle className="text-sm font-semibold">직원 목록</CardTitle>
							{employees && (
								<Badge variant="outline" className="ml-auto text-xs">
									{employees.length}명
								</Badge>
							)}
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40 hover:bg-muted/40">
										<TableHead>이름</TableHead>
										<TableHead>이메일</TableHead>
										<TableHead>부서</TableHead>
										<TableHead>직급</TableHead>
										<TableHead>입사일</TableHead>
										<TableHead>연차 (총/사용/잔여)</TableHead>
										<TableHead>상태</TableHead>
										<TableHead>작업</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{!employees || employees.length === 0 ? (
										<TableRow>
											<TableCell colSpan={8} className="text-center text-muted-foreground py-8">
												직원이 없습니다.
											</TableCell>
										</TableRow>
									) : (
										employees.map((emp) => (
											<TableRow key={emp.id} className={emp.isActive ? '' : 'opacity-60'}>
												<TableCell className="font-medium">{emp.name}</TableCell>
												<TableCell className="text-muted-foreground">{emp.email}</TableCell>
												<TableCell>{emp.department || '-'}</TableCell>
												<TableCell>{emp.position || '-'}</TableCell>
												<TableCell>{dayjs(emp.hireDate).format('YYYY-MM-DD')}</TableCell>
												<TableCell>
													<span className="font-medium">{emp.totalLeaves}</span>
													<span className="text-muted-foreground"> / {emp.usedLeaves} / </span>
													<span className="font-medium text-emerald-600">
														{emp.totalLeaves - emp.usedLeaves}
													</span>
												</TableCell>
												<TableCell>
													<Badge
														className={
															emp.isActive
																? 'bg-green-100 text-green-800 hover:bg-green-100'
																: 'bg-slate-100 text-slate-600 hover:bg-slate-100'
														}
													>
														{emp.isActive ? '활성' : '비활성'}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Button
															size="icon"
															variant="ghost"
															className="h-7 w-7"
															onClick={() => handleEditOpen(emp)}
														>
															<Pencil className="h-3.5 w-3.5" />
														</Button>
														<Switch
															checked={emp.isActive}
															onCheckedChange={() => handleToggleActive(emp)}
														/>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}

				{/* 직원 추가 Dialog */}
				<Dialog open={addOpen} onOpenChange={setAddOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>직원 추가</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-3 py-2">
							{[
								{ id: 'name', label: '이름 *', type: 'text', key: 'name' as keyof EmployeeForm },
								{ id: 'email', label: '이메일 *', type: 'email', key: 'email' as keyof EmployeeForm },
								{ id: 'password', label: '비밀번호 * (8자 이상)', type: 'password', key: 'password' as keyof EmployeeForm },
								{ id: 'department', label: '부서', type: 'text', key: 'department' as keyof EmployeeForm },
								{ id: 'position', label: '직급', type: 'text', key: 'position' as keyof EmployeeForm },
							].map(({ id, label, type, key }) => (
								<div key={id} className="space-y-1.5">
									<Label htmlFor={id}>{label}</Label>
									<Input
										id={id}
										type={type}
										value={form[key]}
										onChange={(e) => setForm({ ...form, [key]: e.target.value })}
									/>
								</div>
							))}
							<div className="space-y-1.5">
								<Label htmlFor="hireDate">입사일</Label>
								<Input
									id="hireDate"
									type="date"
									value={form.hireDate}
									onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="totalLeaves">연간 연차 일수</Label>
								<Input
									id="totalLeaves"
									type="number"
									value={form.totalLeaves}
									onChange={(e) => setForm({ ...form, totalLeaves: e.target.value })}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setAddOpen(false)}>
								취소
							</Button>
							<Button onClick={handleAdd} disabled={createMutation.isPending}>
								추가
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* 직원 수정 Dialog */}
				<Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>직원 정보 수정</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-3 py-2">
							{[
								{ id: 'editName', label: '이름', key: 'name' as keyof EmployeeForm },
								{ id: 'editDept', label: '부서', key: 'department' as keyof EmployeeForm },
								{ id: 'editPos', label: '직급', key: 'position' as keyof EmployeeForm },
							].map(({ id, label, key }) => (
								<div key={id} className="space-y-1.5">
									<Label htmlFor={id}>{label}</Label>
									<Input
										id={id}
										value={editForm[key] ?? ''}
										onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
									/>
								</div>
							))}
							<div className="space-y-1.5">
								<Label htmlFor="editHireDate">입사일</Label>
								<Input
									id="editHireDate"
									type="date"
									value={editForm.hireDate ?? ''}
									onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value })}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="editTotalLeaves">연간 연차 일수</Label>
								<Input
									id="editTotalLeaves"
									type="number"
									value={editForm.totalLeaves ?? ''}
									onChange={(e) => setEditForm({ ...editForm, totalLeaves: e.target.value })}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setEditTarget(null)}>
								취소
							</Button>
							<Button onClick={handleEdit} disabled={updateMutation.isPending}>
								저장
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PageTransition>
	);
}
