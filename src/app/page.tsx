import { redirect } from 'next/navigation';

export default function Home() {
	// 미들웨어에서 리다이렉트 처리
	redirect('/login');
}
