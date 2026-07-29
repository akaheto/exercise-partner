import { CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * One badge for a session's status, shared by the history list and the session
 * detail page — they used to hand-compose `border-success/30 text-success`
 * separately, which is two independent chances to get the dark theme wrong.
 *
 * The mapping onto the semantic variants:
 *   completed   → success  (it happened, and it finished)
 *   in_progress → info     (a neutral "still going", not a judgement)
 *   abandoned   → muted    (ending early is not a failure — see the copy rules)
 */
export function SessionStatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <Badge variant="success">
        <CheckCircle2 aria-hidden="true" /> Completed
      </Badge>
    );
  }
  if (status === "in_progress") {
    return (
      <Badge variant="info">
        <PlayCircle aria-hidden="true" /> In progress
      </Badge>
    );
  }
  return (
    <Badge variant="muted">
      <XCircle aria-hidden="true" /> Ended early
    </Badge>
  );
}
