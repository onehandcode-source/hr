'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

	return (
		<PageTransition>
			<div>
				<h1 className="text-2xl font-bold mb-6">프로필</h1>

				{/* 기본 정보 */}
				<Card className="mb-4">
					<CardContent className="p-6">
						<h2 className="text-base font-semibold mb-3">기본 정보</h2>
						<Separator className="mb-4" />
						<div className="flex flex-col gap-3">
							{[
								{ label: '이름', value: session?.user?.name },
								{ label: '이메일', value: session?.user?.email },
								{ label: '부서', value: session?.user?.department || '-' },
								{ label: '직급', value: session?.user?.position || '-' },
								{
									label: '권한',
									value: session?.user?.role === 'ADMIN' ? '관리자' : '직원',
								},
							].map(({ label, value }) => (
								<div key={label} className="flex gap-4">
									<span className="text-muted-foreground text-sm min-w-[80px]">{label}</span>
									<span className="text-sm font-medium">{value}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* 비밀번호 변경 */}
				<Card>
					<CardContent className="p-6">
						<h2 className="text-base font-semibold mb-3">비밀번호 변경</h2>
						<Separator className="mb-4" />
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
