'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
	LayoutDashboard,
	CalendarCheck,
	CalendarRange,
	BarChart3,
	User,
	Users,
	ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
	text: string;
	href: string;
	icon: React.ReactNode;
	roles?: string[];
}

const navItems: NavItem[] = [
	{ text: '대시보드', href: '/admin', icon: <LayoutDashboard size={20} />, roles: ['ADMIN'] },
	{ text: '직원', href: '/admin/employees', icon: <Users size={20} />, roles: ['ADMIN'] },
	{ text: '연차', href: '/admin/leaves', icon: <CalendarCheck size={20} />, roles: ['ADMIN'] },
	{ text: '평가', href: '/admin/evaluations', icon: <BarChart3 size={20} />, roles: ['ADMIN'] },
	{ text: '일정', href: '/admin/calendar', icon: <CalendarRange size={20} />, roles: ['ADMIN'] },

	{ text: '대시보드', href: '/employee', icon: <LayoutDashboard size={20} />, roles: ['EMPLOYEE'] },
	{ text: '연차신청', href: '/employee/leaves/request', icon: <CalendarCheck size={20} />, roles: ['EMPLOYEE'] },
	{ text: '달력', href: '/employee/leaves/calendar', icon: <CalendarRange size={20} />, roles: ['EMPLOYEE'] },
	{ text: '내 평가', href: '/employee/evaluations', icon: <ClipboardList size={20} />, roles: ['EMPLOYEE'] },
	{ text: '프로필', href: '/profile', icon: <User size={20} /> },
];

export default function BottomNav() {
	const { data: session } = useSession();
	const pathname = usePathname();

	if (!session) return null;

	const filtered = navItems.filter(
		(item) => item.roles === undefined || item.roles.includes(session.user.role),
	);

	// 관리자는 5개, 직원은 5개 (프로필 포함)
	const items = filtered.slice(0, 5);

	return (
		<nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border">
			<div className="flex items-stretch h-16">
				{items.map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors',
								isActive
									? 'text-primary'
									: 'text-muted-foreground hover:text-foreground',
							)}
						>
							<span className={cn(
								'p-1 rounded-lg transition-colors',
								isActive && 'bg-primary/10',
							)}>
								{item.icon}
							</span>
							{item.text}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
