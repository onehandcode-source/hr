'use client';

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from 'recharts';

const LEAVE_TYPE_LABELS: Record<string, string> = {
	ANNUAL: '연차',
	HALF: '반차',
	HALF_AM: '오전반차',
	HALF_PM: '오후반차',
	SICK: '병가',
	SPECIAL: '경조사',
};

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── 월별 연차 신청 현황 ───────────────────────────────────
interface MonthlyData {
	month: string;
	승인: number;
	대기: number;
	거부: number;
}

export function MonthlyLeaveChart({ data }: { data: MonthlyData[] }) {
	return (
		<ResponsiveContainer width="100%" height={260}>
			<BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
				<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
				<XAxis dataKey="month" tick={{ fontSize: 11 }} />
				<YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
				<Tooltip />
				<Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
				<Bar dataKey="승인" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={24} />
				<Bar dataKey="대기" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={24} />
				<Bar dataKey="거부" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
			</BarChart>
		</ResponsiveContainer>
	);
}

// ─── 부서별 연차 사용률 ───────────────────────────────────
interface DeptData {
	department: string;
	사용률: number;
}

export function DeptLeaveRateChart({ data }: { data: DeptData[] }) {
	return (
		<ResponsiveContainer width="100%" height={Math.max(180, data.length * 48)}>
			<BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
				<CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
				<XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
				<YAxis type="category" dataKey="department" tick={{ fontSize: 12 }} width={64} />
				<Tooltip formatter={(v) => [`${v}%`, '사용률']} />
				<Bar dataKey="사용률" fill="#6366f1" radius={[0, 3, 3, 0]} maxBarSize={20} label={{ position: 'right', fontSize: 11, formatter: (v: any) => `${v}%` }} />
			</BarChart>
		</ResponsiveContainer>
	);
}

// ─── 연차 유형별 분포 ─────────────────────────────────────
interface TypeData {
	type: string;
	count: number;
}

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
	cx, cy, midAngle, innerRadius, outerRadius, percent, index, name,
}: any) => {
	if (percent < 0.05) return null;
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);
	return (
		<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
			{`${(percent * 100).toFixed(0)}%`}
		</text>
	);
};

export function LeaveTypePieChart({ data }: { data: TypeData[] }) {
	const labeled = data.map((d) => ({ ...d, name: LEAVE_TYPE_LABELS[d.type] || d.type }));

	return (
		<ResponsiveContainer width="100%" height={240}>
			<PieChart>
				<Pie
					data={labeled}
					dataKey="count"
					nameKey="name"
					cx="50%"
					cy="50%"
					outerRadius={90}
					labelLine={false}
					label={renderCustomLabel}
				>
					{labeled.map((_, i) => (
						<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
					))}
				</Pie>
				<Tooltip formatter={(v, n) => [v + '건', n]} />
				<Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
			</PieChart>
		</ResponsiveContainer>
	);
}

// ─── 직원 연차 현황 도넛 ──────────────────────────────────
export function LeaveBalanceDonut({
	used,
	remaining,
}: {
	used: number;
	remaining: number;
}) {
	const total = used + remaining;
	const data = [
		{ name: '사용', value: Number(used) },
		{ name: '잔여', value: Number(remaining) },
	];

	return (
		<div className="relative">
			<ResponsiveContainer width="100%" height={140}>
				<PieChart>
					<Pie
						data={data}
						dataKey="value"
						cx="50%"
						cy="50%"
						innerRadius={40}
						outerRadius={56}
						startAngle={90}
						endAngle={-270}
						strokeWidth={0}
					>
						<Cell fill="#ef4444" />
						<Cell fill="#22c55e" />
					</Pie>
					<Tooltip formatter={(v, n) => [`${v}일`, n]} />
					<Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
				</PieChart>
			</ResponsiveContainer>
			{/* 중앙 텍스트 */}
			<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: -20 }}>
				<p className="text-xl font-bold text-slate-800">{remaining}일</p>
				<p className="text-xs text-muted-foreground">잔여</p>
			</div>
		</div>
	);
}
