'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
	LayoutDashboard,
	Users,
	CalendarCheck,
	ClipboardList,
	BarChart3,
	CalendarDays,
	PlusCircle,
	CalendarRange,
	User,
	ListChecks,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const SIDEBAR_BG = '#0f172a';
const ACTIVE_BG = 'rgba(99, 102, 241, 0.15)';
const ACTIVE_COLOR = '#818cf8';
const TEXT_COLOR = '#94a3b8';
const HOVER_BG = 'rgba(255, 255, 255, 0.06)';

interface MenuItem {
	text: string;
	href: string;
	icon: React.ReactNode;
	roles?: string[];
}

const menuItems: MenuItem[] = [
	{ text: '대시보드', href: '/admin', icon: <LayoutDashboard size={16} />, roles: ['ADMIN'] },
	{ text: '직원 관리', href: '/admin/employees', icon: <Users size={16} />, roles: ['ADMIN'] },
	{ text: '연차 관리', href: '/admin/leaves', icon: <CalendarCheck size={16} />, roles: ['ADMIN'] },
	{
		text: '평가 항목',
		href: '/admin/evaluations/items',
		icon: <ClipboardList size={16} />,
		roles: ['ADMIN'],
	},
	{
		text: '직원 평가',
		href: '/admin/evaluations',
		icon: <BarChart3 size={16} />,
		roles: ['ADMIN'],
	},
	{
		text: '전체 일정',
		href: '/admin/calendar',
		icon: <CalendarDays size={16} />,
		roles: ['ADMIN'],
	},
	{ text: '대시보드', href: '/employee', icon: <LayoutDashboard size={16} />, roles: ['EMPLOYEE'] },
	{
		text: '연차 신청',
		href: '/employee/leaves/request',
		icon: <PlusCircle size={16} />,
		roles: ['EMPLOYEE'],
	},
	{
		text: '연차 달력',
		href: '/employee/leaves/calendar',
		icon: <CalendarRange size={16} />,
		roles: ['EMPLOYEE'],
	},
	{
		text: '내 평가',
		href: '/employee/evaluations',
		icon: <ListChecks size={16} />,
		roles: ['EMPLOYEE'],
	},
	{ text: '프로필', href: '/profile', icon: <User size={16} /> },
];

interface SidebarProps {
	mobileOpen: boolean;
	onClose: () => void;
}

function SidebarContent({ onClose }: { onClose: () => void }) {
	const { data: session } = useSession();
	const pathname = usePathname();

	if (!session) return null;

	const filteredMenuItems = menuItems.filter(
		(item) => item.roles === undefined || item.roles.includes(session.user.role),
	);

	return (
		<div className="flex flex-col h-full" style={{ backgroundColor: SIDEBAR_BG }}>
			{/* 로고 */}
			<div className="px-5 py-5 flex items-center gap-3">
				<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
					<span className="text-white font-extrabold text-sm">HR</span>
				</div>
				<span className="text-[#f1f5f9] font-bold text-base">HR 시스템</span>
			</div>

			<div className="border-t border-white/10" />

			{/* 메뉴 */}
			<div className="flex-1 overflow-y-auto px-3 py-3">
				<p
					className="px-3 py-1 text-[0.7rem] font-semibold tracking-widest uppercase mb-1"
					style={{ color: 'rgba(148,163,184,0.5)' }}
				>
					{session.user.role === 'ADMIN' ? '관리자 메뉴' : '직원 메뉴'}
				</p>

				<nav className="flex flex-col gap-0.5">
					{filteredMenuItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={onClose}
								className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
								style={{
									backgroundColor: isActive ? ACTIVE_BG : 'transparent',
									color: isActive ? ACTIVE_COLOR : TEXT_COLOR,
									fontWeight: isActive ? 600 : 400,
								}}
								onMouseEnter={(e) => {
									if (!isActive) {
										e.currentTarget.style.backgroundColor = HOVER_BG;
										e.currentTarget.style.color = '#e2e8f0';
									}
								}}
								onMouseLeave={(e) => {
									if (!isActive) {
										e.currentTarget.style.backgroundColor = 'transparent';
										e.currentTarget.style.color = TEXT_COLOR;
									}
								}}
							>
								<span className="shrink-0">{item.icon}</span>
								<span className="flex-1">{item.text}</span>
								{isActive && (
									<span
										className="w-1.5 h-1.5 rounded-full shrink-0"
										style={{ backgroundColor: ACTIVE_COLOR }}
									/>
								)}
							</Link>
						);
					})}
				</nav>
			</div>

			{/* 하단 사용자 정보 */}
			<div className="border-t border-white/10" />
			<div className="px-4 py-4">
				<div className="flex items-center gap-3">
					<div
						className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
						style={{ backgroundColor: 'rgba(99,102,241,0.2)' }}
					>
						<span className="font-bold text-sm" style={{ color: ACTIVE_COLOR }}>
							{session.user.name?.[0] ?? 'U'}
						</span>
					</div>
					<div className="overflow-hidden">
						<p className="text-[#f1f5f9] text-[0.8rem] font-semibold leading-snug truncate">
							{session.user.name}
						</p>
						<p className="text-[0.7rem] truncate" style={{ color: TEXT_COLOR }}>
							{session.user.role === 'ADMIN' ? '관리자' : '직원'}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
	const { data: session } = useSession();
	if (!session) return null;

	return (
		<>
			{/* 모바일 Sheet */}
			<Sheet open={mobileOpen} onOpenChange={(open) => !open && onClose()}>
				<SheetContent side="left" className="p-0 w-60 border-0" style={{ backgroundColor: '#0f172a' }}>
					<SidebarContent onClose={onClose} />
				</SheetContent>
			</Sheet>

			{/* 데스크탑 고정 aside */}
			<aside className="hidden sm:flex w-60 shrink-0 flex-col fixed inset-y-0 left-0 z-20">
				<SidebarContent onClose={() => {}} />
			</aside>
		</>
	);
}
