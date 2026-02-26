'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
			<h1 className="text-8xl font-bold text-primary mb-4">403</h1>
			<h2 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h2>
			<p className="text-muted-foreground mb-6">이 페이지에 접근할 권한이 없습니다.</p>
			<Button asChild>
				<Link href="/">홈으로 돌아가기</Link>
			</Button>
		</div>
	);
}
