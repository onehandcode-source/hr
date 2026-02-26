'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, dayjsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import {
	Box,
	ToggleButton,
	ToggleButtonGroup,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Paper,
	Typography,
	useMediaQuery,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';

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
	resource: LeaveEvent;
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

// 부서별 색상 (모듈 외부에서 관리하면 SSR 문제 발생할 수 있으므로 함수로 처리)
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

export default function LeaveCalendarView({ leaves, title }: Props) {
	const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [calendarDate, setCalendarDate] = useState(new Date());
	const [calendarView, setCalendarView] = useState<(typeof Views)[keyof typeof Views]>(Views.MONTH);
	const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

	const isMobile = useMediaQuery('(max-width:600px)');

	useEffect(() => {
		if (isMobile) {
			setViewMode('list');
			setCalendarView(Views.AGENDA);
		}
	}, [isMobile]);

	const deptColorMap = useMemo(() => buildDeptColorMap(leaves), [leaves]);

	// react-big-calendar는 end가 exclusive → 하루 추가
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

	// 현재 캘린더 표시 월의 연차만 목록에 표시 (연동)
	const filteredLeaves = useMemo(() => {
		const month = dayjs(calendarDate);
		return leaves.filter((leave) => {
			const start = dayjs(leave.startDate);
			const end = dayjs(leave.endDate);
			return start.isBefore(month.endOf('month')) && end.isAfter(month.startOf('month'));
		});
	}, [leaves, calendarDate]);

	const eventStyleGetter = (event: CalendarEvent) => {
		const color = deptColorMap[event.resource.user.department] ?? '#1976d2';
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

	const handleCalendarEventSelect = (event: CalendarEvent) => {
		setSelectedId(event.id);
	};

	const handleRowClick = (leave: LeaveEvent) => {
		setSelectedId(leave.id);
		// 캘린더 뷰로 전환하고 해당 날짜로 이동
		setCalendarDate(new Date(leave.startDate));
		setViewMode('calendar');
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
				{title && (
					<Typography variant="body2" color="text.secondary">
						{title}
					</Typography>
				)}
				<ToggleButtonGroup
					value={viewMode}
					exclusive
					onChange={(_, v) => v && setViewMode(v)}
					size="small"
					sx={{ ml: 'auto' }}
				>
					<ToggleButton value="calendar">
						<CalendarMonthIcon fontSize="small" sx={{ mr: { xs: 0, sm: 0.5 } }} />
						<Box sx={{ display: { xs: 'none', sm: 'block' } }}>캘린더</Box>
					</ToggleButton>
					<ToggleButton value="list">
						<ListAltIcon fontSize="small" sx={{ mr: { xs: 0, sm: 0.5 } }} />
						<Box sx={{ display: { xs: 'none', sm: 'block' } }}>목록</Box>
					</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			{viewMode === 'calendar' ? (
				<Box sx={{ height: { xs: 450, sm: 600 } }}>
					<Calendar
						localizer={localizer}
						events={events}
						startAccessor="start"
						endAccessor="end"
						date={calendarDate}
						onNavigate={(date) => setCalendarDate(date)}
						view={calendarView}
						onView={(view) => setCalendarView(view)}
						messages={CALENDAR_MESSAGES}
						views={isMobile ? [Views.AGENDA] : [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
						eventPropGetter={eventStyleGetter}
						onSelectEvent={handleCalendarEventSelect}
						style={{ height: '100%' }}
						popup
					/>
				</Box>
			) : (
				<>
					<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
						{dayjs(calendarDate).format('YYYY년 MM월')} 기준 · 행 클릭 시 캘린더로 이동
					</Typography>
					<TableContainer component={Paper} variant="outlined">
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>직원명</TableCell>
									<TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>부서</TableCell>
									<TableCell>시작일</TableCell>
									<TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>종료일</TableCell>
									<TableCell>일수</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{filteredLeaves.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} align="center">
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
												hover
												selected={isSelected}
												onClick={() => handleRowClick(leave)}
												sx={{ cursor: 'pointer' }}
											>
												<TableCell>
													{leave.user.name}
													<Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.3 }}>
														<Chip
															label={leave.user.department}
															size="small"
															sx={{
																bgcolor: deptColorMap[leave.user.department] ?? '#1976d2',
																color: '#fff',
																fontSize: '10px',
																height: '18px',
															}}
														/>
													</Box>
												</TableCell>
												<TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
													<Chip
														label={leave.user.department}
														size="small"
														sx={{
															bgcolor: deptColorMap[leave.user.department] ?? '#1976d2',
															color: '#fff',
															fontSize: '11px',
														}}
													/>
												</TableCell>
												<TableCell>{dayjs(leave.startDate).format('YYYY-MM-DD')}</TableCell>
												<TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
													{dayjs(leave.endDate).format('YYYY-MM-DD')}
												</TableCell>
												<TableCell>{leave.days}일</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</>
			)}
		</Box>
	);
}
