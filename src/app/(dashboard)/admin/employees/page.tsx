'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	Box,
	Typography,
	Card,
	CardContent,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Button,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Switch,
	FormControlLabel,
	IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from 'dayjs';

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
		updateMutation.mutate({
			id: emp.id,
			data: { isActive: !emp.isActive },
		});
	};

	if (isLoading) return <Typography>로딩 중...</Typography>;

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant="h4" component="h1">
					직원 관리
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
					<FormControlLabel
						control={
							<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
						}
						label="비활성 직원 포함"
					/>
					<Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
						직원 추가
					</Button>
				</Box>
			</Box>

			<Card>
				<CardContent>
					<TableContainer>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>이름</TableCell>
									<TableCell>이메일</TableCell>
									<TableCell>부서</TableCell>
									<TableCell>직급</TableCell>
									<TableCell>입사일</TableCell>
									<TableCell>연차 (총/사용/잔여)</TableCell>
									<TableCell>상태</TableCell>
									<TableCell>작업</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{employees && employees.length === 0 ? (
									<TableRow>
										<TableCell colSpan={8} align="center">
											직원이 없습니다.
										</TableCell>
									</TableRow>
								) : (
									employees?.map((emp) => (
										<TableRow key={emp.id} sx={{ opacity: emp.isActive ? 1 : 0.5 }}>
											<TableCell>{emp.name}</TableCell>
											<TableCell>{emp.email}</TableCell>
											<TableCell>{emp.department || '-'}</TableCell>
											<TableCell>{emp.position || '-'}</TableCell>
											<TableCell>{dayjs(emp.hireDate).format('YYYY-MM-DD')}</TableCell>
											<TableCell>
												{emp.totalLeaves} / {emp.usedLeaves} / {emp.totalLeaves - emp.usedLeaves}
											</TableCell>
											<TableCell>
												<Chip
													label={emp.isActive ? '활성' : '비활성'}
													color={emp.isActive ? 'success' : 'default'}
													size="small"
												/>
											</TableCell>
											<TableCell>
												<Box sx={{ display: 'flex', gap: 1 }}>
													<IconButton size="small" onClick={() => handleEditOpen(emp)}>
														<EditIcon fontSize="small" />
													</IconButton>
													<Switch
														size="small"
														checked={emp.isActive}
														onChange={() => handleToggleActive(emp)}
													/>
												</Box>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</CardContent>
			</Card>

			{/* 직원 추가 Dialog */}
			<Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>직원 추가</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
						<TextField
							label="이름 *"
							fullWidth
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
						/>
						<TextField
							label="이메일 *"
							type="email"
							fullWidth
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
						/>
						<TextField
							label="비밀번호 * (8자 이상)"
							type="password"
							fullWidth
							value={form.password}
							onChange={(e) => setForm({ ...form, password: e.target.value })}
						/>
						<TextField
							label="부서"
							fullWidth
							value={form.department}
							onChange={(e) => setForm({ ...form, department: e.target.value })}
						/>
						<TextField
							label="직급"
							fullWidth
							value={form.position}
							onChange={(e) => setForm({ ...form, position: e.target.value })}
						/>
						<TextField
							label="입사일"
							type="date"
							fullWidth
							value={form.hireDate}
							onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
							slotProps={{ inputLabel: { shrink: true } }}
						/>
						<TextField
							label="연간 연차 일수"
							type="number"
							fullWidth
							value={form.totalLeaves}
							onChange={(e) => setForm({ ...form, totalLeaves: e.target.value })}
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setAddOpen(false)}>취소</Button>
					<Button variant="contained" onClick={handleAdd} disabled={createMutation.isPending}>
						추가
					</Button>
				</DialogActions>
			</Dialog>

			{/* 직원 수정 Dialog */}
			<Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
				<DialogTitle>직원 정보 수정</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
						<TextField
							label="이름"
							fullWidth
							value={editForm.name ?? ''}
							onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
						/>
						<TextField
							label="부서"
							fullWidth
							value={editForm.department ?? ''}
							onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
						/>
						<TextField
							label="직급"
							fullWidth
							value={editForm.position ?? ''}
							onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
						/>
						<TextField
							label="입사일"
							type="date"
							fullWidth
							value={editForm.hireDate ?? ''}
							onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value })}
							slotProps={{ inputLabel: { shrink: true } }}
						/>
						<TextField
							label="연간 연차 일수"
							type="number"
							fullWidth
							value={editForm.totalLeaves ?? ''}
							onChange={(e) => setEditForm({ ...editForm, totalLeaves: e.target.value })}
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditTarget(null)}>취소</Button>
					<Button variant="contained" onClick={handleEdit} disabled={updateMutation.isPending}>
						저장
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
