// Round axis bounds to readable VND steps without changing plotted values.
export function chartScale(values: number[]) {
  const finite = values.filter(Number.isFinite);
  const min = Math.min(0, ...finite), max = Math.max(0, ...finite);
  const raw = Math.max(1, (max - min) / 5);
  const power = 10 ** Math.floor(Math.log10(raw));
  const factor = [1, 2, 2.5, 5, 10].find(n => n >= raw / power) || 10;
  const step = Math.max(1, factor * power);
  const lower = Math.floor(min / step) * step;
  const upper = max === min ? lower + 5 * step : Math.ceil(max / step) * step;
  const span = upper - lower;
  const ticks = Array.from({ length: Math.round(span / step) + 1 }, (_, i) => {
    const tick = upper - i * step;
    return Object.is(tick, -0) ? 0 : tick;
  });
  return { lower, upper, span, step, ticks };
}
