import type { LucideIcon } from "lucide-react";

/**
 * Honest "not built yet" state for nav destinations ahead of their epic —
 * per VISUAL_STYLE_GUIDE.docx tone/voice: direct, no hype, no fake activity.
 */
export function ComingSoon({ icon: Icon, title, epic }: { icon: LucideIcon; title: string; epic: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <Icon className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Not built yet — part of {epic}.</p>
    </div>
  );
}
