import { Badge } from "@/components/ui/Badge";

const POSITIVE = new Set(["APPROVED", "CLOSED_WON", "RESOLVED", "VERIFIED", "PUBLISHED"]);
const NEGATIVE = new Set(["REJECTED", "CLOSED_LOST", "FLAGGED", "DISMISSED", "CANCELLED"]);

export function StatusBadge({ status }: { status: string }) {
  const variant = POSITIVE.has(status) ? "teal" : NEGATIVE.has(status) ? "ember" : "ghost";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}
