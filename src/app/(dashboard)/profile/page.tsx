'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageTransition from '@/components/common/PageTransition';

export default function ProfilePage() {
	const { data: session } = useSession();
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const passwordMutation = useMutation({
		mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
			const res = await fetch(`/api/users/${session?.user?.id}/password`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || '비밀번호 변경 실패');
			}
			return res.json();
		},
		onSuccess: () => {
			toast.success('비밀번호가 변경되었습니다.');
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
		},
		onError: (err: Error) => {
			toast.error(err.message);
		},
	});

	const handlePasswordChange = (e: React.FormEvent) => {
		e.preventDefault();
		if (!currentPassword || !newPassword || !confirmPassword) {
			toast.error('모든 필드를 입력해주세요.');
			return;
		}
		if (newPassword.length < 8) {
			toast.error('새 비밀번호는 8자 이상이어야 합니다.');
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error('새 비밀번호가 일치하지 않습니다.');
			return;
		}
		passwordMutation.mutate({ currentPassword, newPassword });
	};

	const infoRows = [
		{ label: '이름', value: session?.user?.name },
		{ label: '이메일', value: session?.user?.email },
		{ label: '부서', value: session?.user?.department || '-' },
		{ label: '직급', value: session?.user?.position || '-' },
	];

	return (
		<PageTransition>
			<div>
				<div className="mb-6">
					<h1 className="text-2xl font-bold">프로필</h1>
					<p className="text-sm text-muted-foreground mt-0.5">내 계정 정보를 확인하고 관리하세요</p>
				</div>

				{/* 기본 정보 */}
				<Card className="mb-4">
					<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
						<div className="p-1.5 rounded-md bg-primary/10">
							<UserCircle className="h-4 w-4 text-primary" />
						</div>
						<CardTitle className="text-sm font-semibold">기본 정보</CardTitle>
						<Badge
							className={`ml-auto ${
								session?.user?.role === 'ADMIN'
									? 'bg-violet-100 text-violet-800 hover:bg-violet-100'
									: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
							}`}
						>
							{session?.user?.role === 'ADMIN' ? '관리자' : '직원'}
						</Badge>
					</CardHeader>
					<CardContent className="p-5">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{infoRows.map(({ label, value }) => (
								<div key={label} className="space-y-1">
									<p className="text-xs text-muted-foreground">{label}</p>
									<p className="text-sm font-medium">{value}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* 비밀번호 변경 */}
				<Card>
					<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
						<div className="p-1.5 rounded-md bg-amber-50">
							<KeyRound className="h-4 w-4 text-amber-600" />
						</div>
						<CardTitle className="text-sm font-semibold">비밀번호 변경</CardTitle>
					</CardHeader>
					<CardContent className="p-5">
						<form onSubmit={handlePasswordChange}>
							<div className="flex flex-col gap-4 max-w-sm">
								<div className="space-y-1.5">
									<Label htmlFor="currentPassword">현재 비밀번호</Label>
									<Input
										id="currentPassword"
										type="password"
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										required
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="newPassword">새 비밀번호 (8자 이상)</Label>
									<Input
										id="newPassword"
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										required
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
									<Input
										id="confirmPassword"
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
									/>
								</div>
								<Button
									type="submit"
									className="self-start"
									disabled={passwordMutation.isPending}
								>
									{passwordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
