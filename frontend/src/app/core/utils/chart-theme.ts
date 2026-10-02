import { Chart } from 'chart.js';

/**
 * Chart.js styling resolved from the CSS tokens in styles.css.
 * Canvas can't read CSS variables, so call these again when the theme changes.
 */
export function chartColors() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    ink: v('--ink'), ink2: v('--ink-2'), muted: v('--muted'), line: v('--line'), lineStrong: v('--line-strong'),
    surface: v('--surface'), s1: v('--s1'), s2: v('--s2'), font: v('--font'),
  };
}

export type ChartColors = ReturnType<typeof chartColors>;

/** Shared options: recessive dashed grid, muted tabular ticks, card-like tooltip. */
export function baseChartOptions(c: ChartColors, yTick: (v: number) => string) {
  Chart.defaults.font.family = c.font;
  Chart.defaults.font.size = 11;
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.surface, titleColor: c.ink, bodyColor: c.ink2, borderColor: c.line, borderWidth: 1,
        padding: 10, cornerRadius: 8, boxWidth: 8, boxHeight: 8, boxPadding: 4, usePointStyle: true,
        titleFont: { weight: 600 as const, size: 12 }, bodyFont: { size: 12 },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { color: c.lineStrong }, ticks: { color: c.muted, maxRotation: 0, autoSkipPadding: 8 } },
      y: {
        beginAtZero: true,
        grid: { color: c.line },
        border: { display: false, dash: [2, 3] },
        ticks: { color: c.muted, maxTicksLimit: 5, padding: 8, callback: (v: string | number) => yTick(Number(v)) },
      },
    },
  };
}
