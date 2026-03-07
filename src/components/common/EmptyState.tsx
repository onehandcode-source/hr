import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
	return (
		<div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
			{Icon && (
				<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
					<Icon className="h-6 w-6 text-muted-foreground" />
				</div>
			)}
			<p className="text-sm font-medium text-foreground">{title}</p>
			{description && (
				<p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
