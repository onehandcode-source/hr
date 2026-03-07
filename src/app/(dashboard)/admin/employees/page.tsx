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
import EmptyState from '@/components/common/EmptyState';
import { TableSkeleton, CardListSkeleton } from '@/components/common/Skeletons';

interface Employee {
	id: string;
	loginId: string;
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
	loginId: string;
	name: string;
	email: string;
	password: string;
	department: string;
	position: string;
	hireDate: string;
	totalLeaves: string;
}

const emptyForm: EmployeeForm = {
	loginId: '',
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
		if (!form.loginId || !form.name || !form.email || !form.password) {
			toast.error('아이디, 이름, 이메일, 비밀번호는 필수입니다.');
			return;
		}
		if (form.password.length < 8) {
			toast.error('비밀번호는 8자 이상이어야 합니다.');
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
					isLoading ? (
						<CardListSkeleton count={4} />
					) : !employees || employees.length === 0 ? (
						<Card>
							<EmptyState
								icon={Users}
								title="등록된 직원이 없습니다"
								description="직원 추가 버튼을 눌러 첫 번째 직원을 등록하세요"
								action={
									<Button size="sm" onClick={() => setAddOpen(true)}>
										<Plus className="h-4 w-4 mr-1" />
										직원 추가
									</Button>
								}
							/>
						</Card>
					) : (
						<div className="flex flex-col gap-3">
							{employees.map((emp) => (
								<Card key={emp.id} className={`overflow-hidden ${emp.isActive ? '' : 'opacity-60'}`}>
									<div className={`h-1 ${emp.isActive ? 'bg-primary' : 'bg-slate-300'}`} />
									<CardContent className="p-4">
										<div className="flex justify-between items-start">
											<div>
												<p className="font-semibold">{emp.name}</p>
												<p className="text-xs text-muted-foreground">@{emp.loginId}</p>
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
							))}
						</div>
					)
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
							{isLoading ? (
								<TableSkeleton
									headers={['이름', '이메일', '부서', '직급', '입사일', '연차', '상태', '작업']}
								/>
							) : !employees || employees.length === 0 ? (
								<EmptyState
									icon={Users}
									title="등록된 직원이 없습니다"
									description="직원 추가 버튼을 눌러 첫 번째 직원을 등록하세요"
								/>
							) : (
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
										{employees.map((emp) => (
											<TableRow key={emp.id} className={emp.isActive ? '' : 'opacity-60'}>
												<TableCell>
													<p className="font-medium">{emp.name}</p>
													<p className="text-xs text-muted-foreground">@{emp.loginId}</p>
												</TableCell>
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
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				)}

				{/* 직원 추가 Dialog */}
				<Dialog open={addOpen} onOpenChange={setAddOpen}>
					<DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>직원 추가</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-3 py-2">
							{[
								{ id: 'loginId', label: '아이디 *', type: 'text', key: 'loginId' as keyof EmployeeForm, placeholder: '로그인에 사용할 아이디' },
								{ id: 'name', label: '이름 *', type: 'text', key: 'name' as keyof EmployeeForm, placeholder: '' },
								{ id: 'email', label: '이메일 *', type: 'email', key: 'email' as keyof EmployeeForm, placeholder: '' },
								{ id: 'password', label: '비밀번호 * (8자 이상)', type: 'password', key: 'password' as keyof EmployeeForm, placeholder: '' },
								{ id: 'department', label: '부서', type: 'text', key: 'department' as keyof EmployeeForm, placeholder: '' },
								{ id: 'position', label: '직급', type: 'text', key: 'position' as keyof EmployeeForm, placeholder: '' },
							].map(({ id, label, type, key, placeholder }) => (
								<div key={id} className="space-y-1.5">
									<Label htmlFor={id}>{label}</Label>
									<Input
										id={id}
										type={type}
										placeholder={placeholder}
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
									min={0}
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
									min={0}
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
