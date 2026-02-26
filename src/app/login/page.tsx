'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
	const router = useRouter();
	const [loginId, setLoginId] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const result = await signIn('credentials', {
				loginId,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError('아이디 또는 비밀번호가 올바르지 않습니다.');
				setLoading(false);
			} else if (result?.ok) {
				router.push('/');
				router.refresh();
			}
		} catch {
			setError('로그인 중 오류가 발생했습니다.');
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
			<Card className="w-full max-w-sm shadow-md">
				<CardContent className="p-8">
					<div className="flex justify-center mb-5">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src="/logo.png"
							alt="로고"
							className="h-14 object-contain"
						/>
					</div>
					<p className="text-sm text-muted-foreground text-center mb-6">로그인하여 시작하세요</p>

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<div className="space-y-1.5">
							<Label htmlFor="loginId">아이디</Label>
							<Input
								id="loginId"
								type="text"
								required
								value={loginId}
								onChange={(e) => setLoginId(e.target.value)}
								autoComplete="username"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="password">비밀번호</Label>
							<Input
								id="password"
								type="password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete="current-password"
							/>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<Button type="submit" className="w-full mt-1" disabled={loading}>
							{loading ? '로그인 중...' : '로그인'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
