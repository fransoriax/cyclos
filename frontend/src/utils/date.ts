export const getLocalDate = (isoStr: string): Date => {
  if (!isoStr) return new Date();
  
  // If it's a date-only format (YYYY-MM-DD) or has T00:00:00, parse without local shifting
  if (/^\d{4}-\d{2}-\d{2}($|T00:00:00)/.test(isoStr)) {
    const [year, month, day] = isoStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Otherwise, it has a non-zero time component, so parse using local timezone components
  const date = new Date(isoStr);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const formatLocalDate = (isoStr: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!isoStr) return '';
  const date = getLocalDate(isoStr);
  return date.toLocaleDateString('es-ES', options);
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const isBeforeDay = (d1: Date, d2: Date): boolean => {
  const y1 = d1.getFullYear();
  const m1 = d1.getMonth();
  const day1 = d1.getDate();
  
  const y2 = d2.getFullYear();
  const m2 = d2.getMonth();
  const day2 = d2.getDate();
  
  if (y1 < y2) return true;
  if (y1 > y2) return false;
  if (m1 < m2) return true;
  if (m1 > m2) return false;
  return day1 < day2;
};
