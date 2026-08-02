/** direction is from the *current* value's perspective: 'pass' (improved), 'fail' (regressed), 'flat' */
export function compareDirection(current, previous, better) {
  if (current == null || previous == null || previous === 0) return { direction: 'flat', pct: null };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 1) return { direction: 'flat', pct };
  if (better === 'lower') return { direction: pct < 0 ? 'pass' : 'fail', pct };
  if (better === 'higher') return { direction: pct > 0 ? 'pass' : 'fail', pct };
  return { direction: 'flat', pct };
}
