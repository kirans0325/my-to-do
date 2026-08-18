export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'No date set';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return 'No date set';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

export function getRelativeDueLabel(dueString?: string | null): { text: string; isOverdue: boolean; isToday: boolean } {
  if (!dueString) return { text: 'No due date', isOverdue: false, isToday: false };

  const due = new Date(dueString);
  const now = new Date();
  
  if (isNaN(due.getTime())) return { text: dueString, isOverdue: false, isToday: false };

  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isToday = due.toDateString() === now.toDateString();

  if (diffMs < 0) {
    // Overdue
    const overdueHours = Math.abs(diffHours);
    if (overdueHours < 24) {
      return { text: `Overdue by ${overdueHours}h`, isOverdue: true, isToday };
    }
    const overdueDays = Math.abs(diffDays);
    return { text: `Overdue by ${overdueDays}d`, isOverdue: true, isToday };
  } else {
    // Future
    if (isToday) {
      return { text: `Today at ${formatTime(dueString)}`, isOverdue: false, isToday: true };
    }
    if (diffDays === 1) {
      return { text: `Tomorrow at ${formatTime(dueString)}`, isOverdue: false, isToday: false };
    }
    if (diffDays < 7) {
      return { text: `In ${diffDays} days`, isOverdue: false, isToday: false };
    }
    return { text: formatDate(dueString), isOverdue: false, isToday: false };
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDiaryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
