import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import SessionProvider from '@/components/auth/SessionProvider';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import './globals.css';

export const metadata: Metadata = {
	title: 'HR 시스템',
	description: '직원 연차 관리 및 인사평가 시스템',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
			<body>
				<SessionProvider>
					<ReactQueryProvider>
						{children}
						<Toaster richColors position="top-right" />
					</ReactQueryProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
