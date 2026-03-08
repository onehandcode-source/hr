import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
	rows?: number;
	cols?: number;
	/** 컬럼 헤더 레이블 (없으면 빈 헤더) */
	headers?: string[];
}

export function TableSkeleton({ rows = 5, cols = 5, headers }: TableSkeletonProps) {
	const colCount = headers ? headers.length : cols;
	return (
		<Table>
			<TableHeader>
				<TableRow className="bg-muted/40 hover:bg-muted/40">
					{Array.from({ length: colCount }).map((_, i) => (
						<TableHead key={i}>{headers?.[i] ?? <Skeleton className="h-4 w-16" />}</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{Array.from({ length: rows }).map((_, r) => (
					<TableRow key={r}>
						{Array.from({ length: colCount }).map((_, c) => (
							<TableCell key={c}>
								<Skeleton className="h-4" style={{ width: `${60 + ((r + c) % 3) * 20}%` }} />
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

interface CardListSkeletonProps {
	count?: number;
}

export function CardListSkeleton({ count = 4 }: CardListSkeletonProps) {
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: count }).map((_, i) => (
				<Card key={i} className="overflow-hidden">
					<div className="h-1 bg-muted" />
					<CardContent className="p-4">
						<div className="flex justify-between items-start">
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-1/3" />
								<Skeleton className="h-3 w-1/2" />
								<Skeleton className="h-3 w-2/3" />
							</div>
							<Skeleton className="h-6 w-14 rounded-full" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

interface StatCardSkeletonProps {
	count?: number;
	cols?: number;
}

export function StatCardSkeleton({ count = 3, cols = 3 }: StatCardSkeletonProps) {
	return (
		<div className={`grid grid-cols-2 md:grid-cols-${cols} gap-4 mb-6`}>
			{Array.from({ length: count }).map((_, i) => (
				<Card key={i} className="overflow-hidden">
					<div className="h-1 bg-muted" />
					<CardContent className="p-5 min-h-[110px]">
						<div className="flex justify-between items-start">
							<div className="space-y-2 flex-1">
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-8 w-16 mt-2" />
							</div>
							<Skeleton className="h-10 w-10 rounded-xl" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function CardHeaderSkeleton() {
	return (
		<CardHeader className="flex flex-row items-center gap-2 px-5 py-4 border-b space-y-0">
			<Skeleton className="h-7 w-7 rounded-md" />
			<Skeleton className="h-4 w-24" />
		</CardHeader>
	);
}
