import type { EventType, Stage } from "@/lib/types";
import { EVENT_LABELS, STAGE_LABELS } from "@/lib/types";

export const STAGE_COLOR: Record<Stage, string> = {
  "needs-decision": "var(--color-st-decision)",
  submitted: "var(--color-st-submitted)",
  revision: "var(--color-st-revision)",
  accepted: "var(--color-st-accepted)",
  published: "var(--color-st-published)",
};

export function StageBadge({ stage, reason }: { stage: Stage; reason?: "new" | "resubmit" }) {
  const color = STAGE_COLOR[stage];
  const label =
    stage === "needs-decision"
      ? reason === "resubmit"
        ? "Needs a new venue"
        : "Not yet submitted"
      : STAGE_LABELS[stage];
  return (
    <span
      className="chip"
      style={{ color, background: `color-mix(in srgb, ${color} 10%, white)`, borderColor: `color-mix(in srgb, ${color} 25%, white)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

const EVENT_COLOR: Record<EventType, string> = {
  submitted: "var(--color-st-submitted)",
  under_review: "var(--color-st-submitted)",
  revision_requested: "var(--color-st-revision)",
  revision_submitted: "var(--color-st-submitted)",
  accepted: "var(--color-st-accepted)",
  published: "var(--color-st-published)",
  rejected: "var(--color-danger)",
  withdrawn: "var(--color-muted)",
};

export function EventBadge({ type }: { type: EventType }) {
  const color = EVENT_COLOR[type];
  return (
    <span
      className="chip"
      style={{ color, background: `color-mix(in srgb, ${color} 9%, white)`, borderColor: `color-mix(in srgb, ${color} 22%, white)` }}
    >
      {EVENT_LABELS[type]}
    </span>
  );
}
