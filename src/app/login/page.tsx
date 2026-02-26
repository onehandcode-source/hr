'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Card,
	CardContent,
	TextField,
	Button,
	Typography,
	Alert,
	Container,
} from '@mui/material';

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
		} catch (err) {
			setError('로그인 중 오류가 발생했습니다.');
			setLoading(false);
		}
	};

	return (
		<Container maxWidth="sm">
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Card sx={{ width: '100%', maxWidth: 400 }}>
					<CardContent sx={{ p: 4 }}>
						<Typography variant="h4" component="h1" gutterBottom align="center">
							HR 시스템
						</Typography>
						<Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
							로그인하여 시작하세요
						</Typography>

						<form onSubmit={handleSubmit}>
							<TextField
								label="아이디"
								type="text"
								fullWidth
								required
								value={loginId}
								onChange={(e) => setLoginId(e.target.value)}
								sx={{ mb: 2 }}
								autoComplete="username"
							/>

							<TextField
								label="비밀번호"
								type="password"
								fullWidth
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								sx={{ mb: 3 }}
								autoComplete="current-password"
							/>

							{error && (
								<Alert severity="error" sx={{ mb: 2 }}>
									{error}
								</Alert>
							)}

							<Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
								{loading ? '로그인 중...' : '로그인'}
							</Button>
						</form>
					</CardContent>
				</Card>
			</Box>
		</Container>
	);
}
