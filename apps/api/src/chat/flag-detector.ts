/**
 * Cheap, synchronous heuristics for the trust & safety flagged-content
 * queue (admin screen A-11) — catches the two most common ways people try
 * to move a conversation off-platform to dodge lead fees. Not meant to be
 * airtight; it's a first-pass filter that surfaces messages for a human.
 */

// A run of 7+ digits (with optional separators) reads as a phone number in
// almost any format/locale we'd see here.
const PHONE_PATTERN = /(?:\+?\d[\s.-]?){7,}\d/;

const OFF_PLATFORM_KEYWORDS =
  /\b(whatsapp|whats app|telegram|viber|imo|call me at|text me at|my number is|contact me on)\b/i;

export function detectFlag(body: string): {
  flagged: boolean;
  reason?: string;
} {
  if (PHONE_PATTERN.test(body)) {
    return {
      flagged: true,
      reason: 'Message appears to contain a phone number',
    };
  }
  if (OFF_PLATFORM_KEYWORDS.test(body)) {
    return {
      flagged: true,
      reason: 'Message references an off-platform contact channel',
    };
  }
  return { flagged: false };
}
