import { computePriorityScore } from "@/lib/mastery";
import type { FlashcardDTO } from "@/types";
import { FOCUS_THRESHOLD } from "@/types";

export function showFocusBadge(
  card: Pick<FlashcardDTO, "userPinned" | "focusDismissed" | "priorityScore">,
): boolean {
  if (card.userPinned) return true;
  if (card.focusDismissed) return false;
  return (card.priorityScore ?? 0) >= FOCUS_THRESHOLD;
}

export function getFocusPatch(pinForFocus: boolean) {
  return {
    userPinned: pinForFocus,
    focusDismissed: !pinForFocus,
  };
}

export function applyFocusPatch(
  card: FlashcardDTO,
  pinForFocus: boolean,
): FlashcardDTO {
  const { userPinned, focusDismissed } = getFocusPatch(pinForFocus);
  const priorityScore = computePriorityScore(card.stats, userPinned);

  return {
    ...card,
    userPinned,
    focusDismissed,
    priorityScore,
  };
}
