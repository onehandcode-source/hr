'use client';

import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Menu, ChevronDown, LogOut } from 'lucide-react';
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
import NotificationBell from './NotificationBell';

interface NavbarProps {
	onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
	const { data: session } = useSession();

	const handleLogout = async () => {
		await signOut({ callbackUrl: '/login' });
	};

	return (
		<header className="fixed top-0 right-0 left-0 sm:left-60 z-30 h-14 sm:h-16 flex items-center gap-2 px-4 bg-[rgba(248,250,252,0.85)] backdrop-blur-md border-b border-slate-200">
			{/* 모바일 햄버거 */}
			<Button
				variant="ghost"
				size="icon"
				className="sm:hidden text-slate-500"
				onClick={onMenuClick}
			>
				<Menu className="h-5 w-5" />
			</Button>

			<div className="flex-1" />

			{/* 알림 벨 */}
			{session && <NotificationBell />}

			{/* 유저 드롭다운 */}
			{session && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
							<Avatar className="h-7 w-7">
								<AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
									{session.user.name?.[0] ?? 'U'}
								</AvatarFallback>
							</Avatar>
							<div className="hidden sm:block text-left">
								<p className="text-[0.8rem] font-semibold leading-tight text-slate-900">
									{session.user.name}
								</p>
								<p className="text-[0.7rem] text-slate-500 leading-tight">
									{session.user.role === 'ADMIN' ? '관리자' : '직원'}
								</p>
							</div>
							<ChevronDown className="h-4 w-4 text-slate-400" />
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
