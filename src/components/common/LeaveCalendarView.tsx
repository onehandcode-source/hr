'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, dayjsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { CalendarDays, List, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { HOLIDAY_MAP } from '@/lib/utils/holidays';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

dayjs.locale('ko');
const localizer = dayjsLocalizer(dayjs);

interface LeaveEvent {
	id: string;
	startDate: string;
	endDate: string;
	days: number;
	user: {
		name: string;
		department: string;
	};
}

interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	resource?: LeaveEvent;
}

const CALENDAR_MESSAGES = {
	allDay: '종일',
	previous: '이전',
	next: '다음',
	today: '오늘',
	month: '월',
	week: '주',
	day: '일',
	agenda: '일정',
	date: '날짜',
	time: '시간',
	event: '일정',
	noEventsInRange: '해당 기간에 일정이 없습니다.',
	showMore: (total: number) => `+${total}개 더보기`,
};

const COLOR_PALETTE = [
	'#1976d2',
	'#388e3c',
	'#f57c00',
	'#7b1fa2',
	'#c62828',
	'#00838f',
	'#558b2f',
	'#4527a0',
];

function buildDeptColorMap(leaves: LeaveEvent[]): Record<string, string> {
	const map: Record<string, string> = {};
	let idx = 0;
	for (const leave of leaves) {
		if (!map[leave.user.department]) {
			map[leave.user.department] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
			idx++;
		}
	}
	return map;
}

interface Props {
	leaves: LeaveEvent[];
	title?: string;
}

type RbcView = (typeof Views)[keyof typeof Views];

export default function LeaveCalendarView({ leaves, title }: Props) {
	const [mounted, setMounted] = useState(false);
	const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [calendarDate, setCalendarDate] = useState(new Date());
	const [calendarView, setCalendarView] = useState<RbcView>(Views.MONTH);
	const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

	useEffect(() => setMounted(true), []);

	const isMobile = useIsMobile();

	useEffect(() => {
		if (isMobile) {
			setViewMode('list');
			setCalendarView(Views.AGENDA);
		}
	}, [isMobile]);

	// isMobile 전환 직후 calendarView가 availableViews에 없는 렌더가 생길 수 있으므로 보정
	const availableViews: RbcView[] = isMobile
		? [Views.AGENDA]
		: [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];

	const safeCalendarView: RbcView = availableViews.includes(calendarView)
		? calendarView
		: availableViews[0];

	const deptColorMap = useMemo(() => buildDeptColorMap(leaves), [leaves]);

	// 공휴일 배경 이벤트 (현재 월 ±2개월 범위 생성)
	const holidayEvents = useMemo(() => {
		const center = dayjs(calendarDate);
		const rangeStart = center.subtract(2, 'month').startOf('month');
		const rangeEnd = center.add(2, 'month').endOf('month');
		const result = [];
		let cur = rangeStart;
		while (cur.isBefore(rangeEnd)) {
			const dateStr = cur.format('YYYY-MM-DD');
			if (HOLIDAY_MAP[dateStr]) {
				result.push({
					id: `holiday-${dateStr}`,
					title: HOLIDAY_MAP[dateStr],
					start: cur.toDate(),
					end: cur.add(1, 'day').toDate(),
					isHoliday: true,
				});
			}
			cur = cur.add(1, 'day');
		}
		return result;
	}, [calendarDate]);

	const events: CalendarEvent[] = useMemo(
		() =>
			leaves.map((leave) => ({
				id: leave.id,
				title: `${leave.user.name} (${leave.user.department})`,
				start: new Date(leave.startDate),
				end: dayjs(leave.endDate).add(1, 'day').toDate(),
				resource: leave,
			})),
		[leaves],
	);

	const filteredLeaves = useMemo(() => {
		const month = dayjs(calendarDate);
		return leaves.filter((leave) => {
			const start = dayjs(leave.startDate);
			const end = dayjs(leave.endDate);
			return start.isBefore(month.endOf('month')) && end.isAfter(month.startOf('month'));
		});
	}, [leaves, calendarDate]);

	const eventStyleGetter = (event: CalendarEvent) => {
		const color = deptColorMap[event.resource?.user.department ?? ''] ?? '#1976d2';
		const isSelected = event.id === selectedId;
		return {
			style: {
				backgroundColor: color,
				borderRadius: '4px',
				border: isSelected ? '2px solid #fff' : 'none',
				outline: isSelected ? `3px solid ${color}` : 'none',
				color: '#fff',
				fontSize: '12px',
				padding: '2px 6px',
				opacity: isSelected ? 1 : 0.85,
			},
		};
	};

	// 공휴일 날짜 셀 스타일
	const dayCellStyleGetter = (date: Date) => {
		const dateStr = dayjs(date).format('YYYY-MM-DD');
		if (HOLIDAY_MAP[dateStr]) {
			return {
				style: {
					backgroundColor: 'rgba(239, 68, 68, 0.06)',
				},
			};
		}
		return {};
	};

	const handleCalendarEventSelect = (event: CalendarEvent) => {
		setSelectedId(event.id);
	};

	const handleRowClick = (leave: LeaveEvent) => {
		setSelectedId(leave.id);
		setCalendarDate(new Date(leave.startDate));
		setViewMode('calendar');
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-3">
				{title && <p className="text-sm text-muted-foreground">{title}</p>}
				<ToggleGroup
					type="single"
					value={viewMode}
					onValueChange={(v) => v && setViewMode(v as 'calendar' | 'list')}
					className="ml-auto"
				>
					<ToggleGroupItem value="calendar" className="gap-1.5 text-xs">
						<CalendarDays className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">캘린더</span>
					</ToggleGroupItem>
					<ToggleGroupItem value="list" className="gap-1.5 text-xs">
						<List className="h-3.5 w-3.5" />
						<span className="hidden sm:inline">목록</span>
					</ToggleGroupItem>
				</ToggleGroup>
			</div>

			{viewMode === 'calendar' ? (
				<div className="h-[450px] sm:h-[600px]">
					{mounted ? (
						<Calendar
							localizer={localizer}
							events={events}
							backgroundEvents={holidayEvents}
							startAccessor="start"
							endAccessor="end"
							date={calendarDate}
							onNavigate={(date) => setCalendarDate(date)}
							view={safeCalendarView}
							onView={(view) => setCalendarView(view)}
							messages={CALENDAR_MESSAGES}
							views={availableViews}
							eventPropGetter={eventStyleGetter}
							dayPropGetter={dayCellStyleGetter}
							onSelectEvent={handleCalendarEventSelect}
							style={{ height: '100%' }}
							popup
						/>
					) : (
						<div className="h-full flex items-center justify-center">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
						</div>
					)}
				</div>
			) : (
				<>
					<p className="text-xs text-muted-foreground mb-2">
						{dayjs(calendarDate).format('YYYY년 MM월')} 기준 · 행 클릭 시 캘린더로 이동
					</p>
					<div className="rounded-md border border-slate-200">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>직원명</TableHead>
									<TableHead className="hidden sm:table-cell">부서</TableHead>
									<TableHead>시작일</TableHead>
									<TableHead className="hidden sm:table-cell">종료일</TableHead>
									<TableHead>일수</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredLeaves.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} className="text-center text-muted-foreground">
											해당 월에 승인된 연차가 없습니다.
										</TableCell>
									</TableRow>
								) : (
									filteredLeaves.map((leave) => {
										const isSelected = leave.id === selectedId;
										return (
											<TableRow
												key={leave.id}
												ref={isSelected ? selectedRowRef : null}
												onClick={() => handleRowClick(leave)}
												className={`cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
											>
												<TableCell>
													{leave.user.name}
													<div className="sm:hidden mt-0.5">
														<Badge
															style={{
																backgroundColor:
																	deptColorMap[leave.user.department] ?? '#1976d2',
																color: '#fff',
															}}
															className="text-[10px] h-4 px-1"
														>
															{leave.user.department}
														</Badge>
													</div>
												</TableCell>
												<TableCell className="hidden sm:table-cell">
													<Badge
														style={{
															backgroundColor:
																deptColorMap[leave.user.department] ?? '#1976d2',
															color: '#fff',
														}}
														className="text-[11px]"
													>
														{leave.user.department}
													</Badge>
												</TableCell>
												<TableCell>{dayjs(leave.startDate).format('YYYY-MM-DD')}</TableCell>
												<TableCell className="hidden sm:table-cell">
													{dayjs(leave.endDate).format('YYYY-MM-DD')}
												</TableCell>
												<TableCell>{leave.days}일</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
				</>
			)}
		</div>
	);
}
