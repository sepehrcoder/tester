// Conversion basis matches the platform blueprint's own worked example
// (§03/10: "5 Marla (1,361 sq ft · 151 sq yd)") — 1 Marla = 272.25 sq ft,
// 1 Kanal = 20 Marla.
const SQFT_PER_MARLA = 272.25;
const MARLA_PER_KANAL = 20;
const SQFT_PER_SQYD = 9;

export function sizeConversion(value: number, unit: string): { primary: string; secondary: string | null } {
  const u = unit.toLowerCase();
  let sqft: number;
  if (u === "marla") sqft = value * SQFT_PER_MARLA;
  else if (u === "kanal") sqft = value * MARLA_PER_KANAL * SQFT_PER_MARLA;
  else if (u === "sqft" || u === "sq ft") sqft = value;
  else return { primary: `${value} ${unit}`, secondary: null };

  const sqyd = sqft / SQFT_PER_SQYD;
  const unitLabel = u.charAt(0).toUpperCase() + u.slice(1);
  const primary = u === "sqft" || u === "sq ft" ? `${Math.round(sqft).toLocaleString()} sq ft` : `${value} ${unitLabel}`;
  return { primary, secondary: `${Math.round(sqft).toLocaleString()} sq ft · ${Math.round(sqyd).toLocaleString()} sq yd` };
}

export function formatSize(value: number, unit: string) {
  const { primary, secondary } = sizeConversion(value, unit);
  return secondary ? `${primary} (${secondary})` : primary;
}
