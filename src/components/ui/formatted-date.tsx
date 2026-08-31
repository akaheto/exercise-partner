"use client";

/**
 * Renders a date with Intl.DateTimeFormat in the viewer's own browser, not
 * the server's. A Server Component calling toLocaleDateString(undefined,
 * ...) directly resolves "undefined locale, no timeZone" against the
 * rendering server's runtime (UTC on Vercel), not the person looking at the
 * page — a session logged at 8pm US-Eastern showed as the next calendar day
 * because of this. Client-rendering the date itself fixes it: the browser's
 * own Intl settings apply.
 */
export function FormattedDate({
  date,
  options,
}: {
  date: Date;
  options: Intl.DateTimeFormatOptions;
}) {
  return <>{date.toLocaleDateString(undefined, options)}</>;
}

/** Date and time together, e.g. an admin error log's timestamp column. */
export function FormattedDateTime({ date }: { date: Date }) {
  return (
    <>
      {date.toLocaleDateString()} {date.toLocaleTimeString()}
    </>
  );
}
