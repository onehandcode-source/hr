import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
	function middleware(req) {
		const token = req.nextauth.token;
		const path = req.nextUrl.pathname;

		// 관리자 전용 페이지 체크
		if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
			return NextResponse.redirect(new URL('/unauthorized', req.url));
		}

		// 루트 경로 접근 시 역할에 따라 리다이렉트
		if (path === '/' && token) {
			if (token.role === 'ADMIN') {
				return NextResponse.redirect(new URL('/admin', req.url));
			} else {
				return NextResponse.redirect(new URL('/employee', req.url));
			}
		}

		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token, req }) => {
				// 로그인 페이지는 항상 접근 가능
				if (req.nextUrl.pathname === '/login') {
					return true;
				}
				// 나머지 페이지는 토큰 필요
				return !!token;
			},
		},
		pages: {
			signIn: '/login',
		},
	},
);

export const config = {
	matcher: ['/', '/admin/:path*', '/employee/:path*'],
};
