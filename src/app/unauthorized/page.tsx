'use client';

import { Box, Container, Typography, Button } from '@mui/material';
import Link from 'next/link';

export default function UnauthorizedPage() {
	return (
		<Container maxWidth="sm">
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					textAlign: 'center',
				}}
			>
				<Typography variant="h1" component="h1" gutterBottom>
					403
				</Typography>
				<Typography variant="h5" component="h2" gutterBottom>
					접근 권한이 없습니다
				</Typography>
				<Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
					이 페이지에 접근할 권한이 없습니다.
				</Typography>
				<Button component={Link} href="/" variant="contained">
					홈으로 돌아가기
				</Button>
			</Box>
		</Container>
	);
}
