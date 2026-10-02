import { Chart } from 'chart.js';
import { Currency, MonthlyFlow } from '../models';
import { currencyCode, formatMoney } from './format';

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

/**
 * Monthly cash flow: income/expense columns plus a net line, all on one money axis.
 */
export function cashFlowChart(flow: MonthlyFlow[], currency: Currency) {
  const c = chartColors();
  const compact = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode(currency), notation: 'compact', maximumFractionDigits: 1 });
  const bar = { borderRadius: 4, borderSkipped: 'start' as const, barPercentage: 0.9, categoryPercentage: 0.62, order: 1 };
  const data = {
    labels: flow.map((f, i) => (i === 0 || f.month === 1 ? [f.label.split(' ')[0], String(f.year)] : f.label.split(' ')[0])),
    datasets: [
      {
        type: 'line', label: 'Net', data: flow.map(f => f.income - f.expenses), borderColor: c.ink, backgroundColor: c.ink, borderWidth: 2,
        pointRadius: flow.map((_, i) => (flow.length > 12 ? 0 : i === flow.length - 1 ? 4 : 2.5)), pointHoverRadius: 5,
        pointBackgroundColor: c.ink, pointBorderColor: c.surface, pointBorderWidth: 2, order: 0,
      },
      { type: 'bar', label: 'Income', data: flow.map(f => f.income), backgroundColor: c.s1, ...bar },
      { type: 'bar', label: 'Expenses', data: flow.map(f => f.expenses), backgroundColor: c.s2, ...bar },
    ],
  };
  const base = baseChartOptions(c, v => compact.format(v));
  const options = {
    ...base,
    plugins: {
      ...base.plugins,
      tooltip: {
        ...base.plugins.tooltip,
        // Net last, after the two bars.
        itemSort: (a: { datasetIndex: number }, b: { datasetIndex: number }) => ((a.datasetIndex + 2) % 3) - ((b.datasetIndex + 2) % 3),
        callbacks: {
          title: (items: { dataIndex: number }[]) => flow[items[0].dataIndex].label,
          label: (ctx: { dataset: { label?: string }; parsed: { y: number }; datasetIndex: number }) =>
            ` ${ctx.dataset.label}: ${formatMoney(ctx.parsed.y, currency, { decimals: 0, sign: ctx.datasetIndex === 0 })}`,
        },
      },
    },
  };
  return { data, options };
}
