/**
 * Date & number formatting helpers.
 * All numbers are rendered with standard Western digits (0-9) by pinning
 * every formatter to the "en-US" locale with the "latn" numbering system.
 */

const dateTimeFmt = new Intl.DateTimeFormat("en-US-u-nu-latn", {
  month: "short",
  day: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-US-u-nu-latn", {
  hour: "numeric",
  minute: "2-digit",
});

const fullFmt = new Intl.DateTimeFormat("en-US-u-nu-latn", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** Compact, human relative timestamp: "just now", "4m", "2h", "May 3". */
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 45_000) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${dateTimeFmt.format(date)} · ${timeFmt.format(date)}`;
}

export function fullDate(iso: string): string {
  return fullFmt.format(new Date(iso));
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
