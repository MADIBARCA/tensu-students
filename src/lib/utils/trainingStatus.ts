export type LiveTrainingStatus = 'upcoming' | 'in_progress' | 'completed';

export function getTrainingLiveStatus(
  dateStr: string,
  timeStr: string,
  durationMinutes: number,
): LiveTrainingStatus {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const now = new Date();

  if (now >= end) return 'completed';
  if (now >= start) return 'in_progress';
  return 'upcoming';
}

export function isSessionCompleted(
  dateStr: string,
  timeStr: string,
  durationMinutes: number,
): boolean {
  return getTrainingLiveStatus(dateStr, timeStr, durationMinutes) === 'completed';
}
