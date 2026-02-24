import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * 두 날짜 사이의 근무일 수를 계산합니다 (주말 제외)
 */
export function calculateWorkdays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = dayjs(startDate);
  const end = dayjs(endDate);

  let tempDate = current;
  while (tempDate.isSameOrBefore(end, 'day')) {
    // 0 = Sunday, 6 = Saturday
    const dayOfWeek = tempDate.day();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    tempDate = tempDate.add(1, 'day');
  }

  return count;
}

/**
 * 날짜 범위가 겹치는지 확인합니다
 */
export function isDateRangeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return dayjs(start1).isSameOrBefore(end2) && dayjs(end1).isSameOrAfter(start2);
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷합니다
 */
export function formatDate(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/**
 * 날짜를 YYYY년 MM월 DD일 형식으로 포맷합니다
 */
export function formatDateKorean(date: Date): string {
  return dayjs(date).format('YYYY년 MM월 DD일');
}
