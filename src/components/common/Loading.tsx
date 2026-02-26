import { Loader2 } from 'lucide-react';

interface LoadingProps {
	message?: string;
}

export default function Loading({ message = '로딩 중...' }: LoadingProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
			<Loader2 className="h-8 w-8 animate-spin text-primary" />
			<p className="text-sm text-muted-foreground">{message}</p>
		</div>
	);
}
