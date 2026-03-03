'use client';

import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Menu, ChevronDown, LogOut, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import NotificationBell from './NotificationBell';

interface NavbarProps {
	onMenuClick: () => void;
}

function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);
	if (!mounted) return <div className="w-14 h-7" />;

	const isDark = resolvedTheme === 'dark';

	return (
		<button
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			aria-label="다크모드 토글"
			className="relative flex items-center w-14 h-7 rounded-full bg-muted border border-border transition-colors hover:bg-muted/80 shrink-0"
		>
			{/* 슬라이딩 원형 */}
			<span
				className={cn(
					'absolute w-5 h-5 rounded-full bg-background shadow-sm flex items-center justify-center transition-transform duration-200',
					isDark ? 'translate-x-[30px]' : 'translate-x-[2px]',
				)}
			>
				{isDark
					? <Moon className="h-3 w-3 text-primary" />
					: <Sun className="h-3 w-3 text-primary" />
				}
			</span>
			{/* 배경 아이콘 */}
			<Sun className="h-3 w-3 text-muted-foreground ml-1.5" />
			<span className="flex-1" />
			<Moon className="h-3 w-3 text-muted-foreground mr-1.5" />
		</button>
	);
}

export default function Navbar({ onMenuClick }: NavbarProps) {
	const { data: session } = useSession();

	const handleLogout = async () => {
		await signOut({ callbackUrl: '/login' });
	};

	return (
		<header className="fixed top-0 right-0 left-0 sm:left-60 z-30 h-14 sm:h-16 flex items-center gap-3 px-4 bg-background/85 backdrop-blur-md border-b border-border">
			{/* 모바일 햄버거 */}
			<Button
				variant="ghost"
				size="icon"
				className="sm:hidden text-muted-foreground"
				onClick={onMenuClick}
			>
				<Menu className="h-5 w-5" />
			</Button>

			<div className="flex-1" />

			{/* 다크모드 토글 */}
			<ThemeToggle />

			{/* 알림 벨 */}
			{session && <NotificationBell />}

			{/* 유저 드롭다운 */}
			{session && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors">
							<Avatar className="h-7 w-7">
								<AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
									{session.user.name?.[0] ?? 'U'}
								</AvatarFallback>
							</Avatar>
							<div className="hidden sm:block text-left">
								<p className="text-[0.8rem] font-semibold leading-tight text-foreground">
									{session.user.name}
								</p>
								<p className="text-[0.7rem] text-muted-foreground leading-tight">
									{session.user.role === 'ADMIN' ? '관리자' : '직원'}
								</p>
							</div>
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-52">
						<DropdownMenuLabel>
							<p className="font-semibold text-sm">{session.user.name}</p>
							<p className="text-xs text-muted-foreground font-normal">{session.user.email}</p>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleLogout}
							className="text-destructive focus:text-destructive gap-2"
						>
							<LogOut className="h-4 w-4" />
							로그아웃
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</header>
	);
}
