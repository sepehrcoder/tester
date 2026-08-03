export function formatPKR(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  const rounded = Math.round(n).toString();
  const last3 = rounded.slice(-3);
  const rest = rounded.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "";
  return `PKR ${grouped}${last3}`;
}

// Pakistan/South-Asian convention: 1 Lac = 100,000, 1 Crore = 100 Lac —
// confirmed as a standard listing-price display alongside the numeral on
// every reference site (platform blueprint §03).
export function formatPKRWords(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "";
  const round1 = (x: number) => Math.round(x * 10) / 10;
  if (n >= 1e7) return `${round1(n / 1e7)} Crore`;
  if (n >= 1e5) return `${round1(n / 1e5)} Lac`;
  if (n >= 1e3) return `${round1(n / 1e3)} Thousand`;
  return formatPKR(n);
}
