'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div className="min-h-screen bg-background">
			<Navbar onMenuClick={() => setMobileOpen(true)} />
			<Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
			<main className="sm:ml-60 p-4 sm:p-6 min-h-screen min-w-0">
				<div className="h-14 sm:h-16" />
				<AnimatePresence mode="wait">{children}</AnimatePresence>
			</main>
		</div>
	);
}
