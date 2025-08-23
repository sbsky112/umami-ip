import { format } from '@/lib/format';
import { dateLocale } from '@/lib/date';
import { getServerMessages, getMessage } from '@/lib/server-i18n';

// Color themes
const themes = {
  light: {
    background: '#ffffff',
    text: '#333333',
    primary: '#3b82f6',
    secondary: '#64748b',
    grid: '#e5e7eb',
    chart: {
      line: '#3b82f6',
      fill: 'rgba(59, 130, 246, 0.1)',
      bar: '#3b82f6',
    },
  },
  dark: {
    background: '#1f2937',
    text: '#f3f4f6',
    primary: '#60a5fa',
    secondary: '#9ca3af',
    grid: '#374151',
    chart: {
      line: '#60a5fa',
      fill: 'rgba(96, 165, 250, 0.1)',
      bar: '#60a5fa',
    },
  },
};

// Metric configurations
const metricConfig = {
  pageviews: {
    label: (msgs: any) => msgs.metrics?.pageviews?.defaultMessage || 'Pageviews',
    color: '#3b82f6',
    icon: '📊',
  },
  visitors: {
    label: (msgs: any) => msgs.metrics?.visitors?.defaultMessage || 'Visitors',
    color: '#10b981',
    icon: '👥',
  },
  sessions: {
    label: (msgs: any) => msgs.metrics?.sessions?.defaultMessage || 'Sessions',
    color: '#f59e0b',
    icon: '🔄',
  },
  bounces: {
    label: (msgs: any) => msgs.metrics?.bounces?.defaultMessage || 'Bounce Rate',
    color: '#ef4444',
    icon: '📉',
    format: (value: number) => `${value.toFixed(1)}%`,
  },
  duration: {
    label: (msgs: any) => msgs.metrics?.duration?.defaultMessage || 'Avg. Duration',
    color: '#8b5cf6',
    icon: '⏱️',
    format: (value: number) => format(value, 'duration'),
  },
};

export async function renderBadgeSVG({
  data,
  metric,
  website,
  period,
  theme,
  language,
  title,
  color,
  showTitle,
  showValues,
  width = 400,
  height = 200,
}: {
  data: any;
  metric: string;
  website: any;
  period: string;
  theme: string;
  language: string;
  title?: string;
  color?: string;
  showTitle?: boolean;
  showValues?: boolean;
  width?: number;
  height?: number;
}) {
  const colors = themes[theme as keyof typeof themes];
  const config = metricConfig[metric as keyof typeof metricConfig];
  const msgs = await getServerMessages(language);
  
  // Use custom color if provided
  if (color) {
    colors.primary = color;
    colors.chart.line = color;
    colors.chart.bar = color;
  }
  
  const value = data[metric];
  const formattedValue = config.format
    ? config.format(value)
    : format(Number(value) || 0, Number(value) > 999999 ? '0.0a' : '0,0');

  const periodLabel = {
    day: msgs.dateRange?.today?.defaultMessage || 'Today',
    week: 'Last 7 days',
    month: 'Last 30 days',
    year: 'Last 12 months',
  }[period];

  const displayTitle = title || website?.name || '';

  // Use provided dimensions
  const padding = 16;
  const effectiveWidth = Math.max(200, width);
  const effectiveHeight = Math.max(
    showTitle && showValues ? 90 : 
    showTitle || showValues ? 70 : 50, 
    height
  );

  // Calculate vertical positions based on what's shown
  let yOffset = padding;
  const titleY = showTitle ? yOffset + 20 : null;
  if (showTitle) yOffset += 25;
  
  const valueY = showValues ? yOffset + 35 : yOffset + (effectiveHeight / 2);
  if (showValues) yOffset += 40;
  
  const metricY = showValues ? yOffset + 15 : null;

  return `
<svg width="${effectiveWidth}" height="${effectiveHeight}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: bold 14px -apple-system, BlinkMacSystemFont, sans-serif; fill: ${colors.text}; }
    .value { font: bold ${showValues ? '24px' : '18px'} -apple-system, BlinkMacSystemFont, sans-serif; fill: ${colors.primary}; }
    .metric { font: 12px -apple-system, BlinkMacSystemFont, sans-serif; fill: ${colors.secondary}; }
    .period { font: 11px -apple-system, BlinkMacSystemFont, sans-serif; fill: ${colors.secondary}; }
  </style>
  
  <rect width="${effectiveWidth}" height="${effectiveHeight}" fill="${colors.background}" rx="6"/>
  
  ${showTitle ? `<text x="${padding}" y="${titleY}" class="title">${displayTitle}</text>` : ''}
  
  ${showValues ? `
  <!-- Value -->
  <text x="${padding}" y="${valueY}" class="value">${formattedValue}</text>
  
  <!-- Metric label -->
  <text x="${padding}" y="${metricY}" class="metric">${config.label(msgs)}</text>
  ` : `
  <!-- Simple value without metric label -->
  <text x="${padding}" y="${valueY}" class="value">${formattedValue}</text>
  `}
  
  <!-- Period -->
  <text x="${effectiveWidth - padding - 5}" y="${effectiveHeight - padding - 2}" class="period" text-anchor="end">${periodLabel}</text>
</svg>
  `.trim();
}

export async function renderChartSVG({
  data,
  metric,
  website,
  period,
  width,
  height,
  theme,
  language,
  title,
  color,
  showTitle,
  showValues,
}: {
  data: any;
  metric: string;
  website: any;
  period: string;
  width: number;
  height: number;
  theme: string;
  language: string;
  title?: string;
  color?: string;
  showTitle?: boolean;
  showValues?: boolean;
}) {
  const colors = themes[theme as keyof typeof themes];
  
  // Use custom color if provided
  if (color) {
    colors.primary = color;
    colors.chart.line = color;
    colors.chart.bar = color;
    // Convert hex to rgba for fill
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      colors.chart.fill = `rgba(${r}, ${g}, ${b}, 0.1)`;
    } else {
      colors.chart.fill = color.replace(')', ', 0.1)').replace('rgb', 'rgba');
    }
  }
  const config = metricConfig[metric as keyof typeof metricConfig];
  const msgs = await getServerMessages(language);
  
  const value = data[metric];
  const formattedValue = config.format
    ? config.format(value)
    : format(Number(value) || 0, Number(value) > 999999 ? '0.0a' : '0,0');

  const periodLabel = {
    day: msgs.dateRange?.today?.defaultMessage || 'Today',
    week: 'Last 7 days',
    month: 'Last 30 days',
    year: 'Last 12 months',
  }[period];

  const padding = 40;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  // Generate mock trend data (in real implementation, this would come from time-series data)
  const trendData = generateTrendData(metric, value, period);

  // Calculate scales
  const maxValue = Math.max(...trendData.map(d => d.value));
  const scale = chartHeight / maxValue;

  // Generate path for line chart
  const points = trendData.map((d, i) => {
    const x = padding + (i / (trendData.length - 1)) * chartWidth;
    const y = height - padding - (d.value * scale);
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `${points} ${width - padding},${height - padding} ${padding},${height - padding}`;

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.chart.fill};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${colors.chart.fill};stop-opacity:0" />
    </linearGradient>
  </defs>
  
  <style>
    .title { font: bold 16px -apple-system, BlinkMacSystemFont, sans-serif; fill: ${colors.text}; }
    .value { font: bold 32px -apple-system, BlinkMacSystemFont, sans-serif; fill: ${colors.primary}; }
    .metric { font: 14px -apple-system, BlinkMacSystemFont, sans-serif; fill: ${colors.secondary}; }
    .period { font: 12px -apple-system, BlinkMacSystemFont, sans-serif; fill: ${colors.secondary}; }
    .grid-line { stroke: ${colors.grid}; stroke-width: 1; stroke-dasharray: 2,2; }
    .chart-line { stroke: ${colors.chart.line}; stroke-width: 3; fill: none; }
    .chart-area { fill: url(#fillGradient); }
  </style>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${colors.background}" rx="8"/>
  
  ${showTitle ? `
  <!-- Title -->
  <text x="${padding}" y="${padding - 10}" class="title">${title || website.name}</text>
` : ''}
  
  <!-- Grid lines -->
  ${[0, 0.25, 0.5, 0.75, 1].map(ratio => `
    <line x1="${padding}" y1="${height - padding - (chartHeight * ratio)}" 
          x2="${width - padding}" y2="${height - padding - (chartHeight * ratio)}" 
          class="grid-line" />
  `).join('')}
  
  <!-- Chart area -->
  <path d="M ${areaPath}" class="chart-area" />
  
  <!-- Chart line -->
  <polyline points="${points}" class="chart-line" />
  
  ${showValues ? `
  <!-- Value -->
  <text x="${padding}" y="${height - padding + 35}" class="value">${formattedValue}</text>
  
  <!-- Metric label -->
  <text x="${padding}" y="${height - padding + 55}" class="metric">${config.label(msgs)}</text>
` : `
  <!-- Value without metric -->
  <text x="${padding}" y="${height - padding + 45}" class="value">${formattedValue}</text>
`}
  
  <!-- Period -->
  <text x="${width - padding}" y="${height - padding + 55}" class="period" text-anchor="end">${periodLabel}</text>
</svg>
  `.trim();
}

// Helper function to generate trend data
function generateTrendData(metric: string, totalValue: number, period: string) {
  const points = period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? 30 : 12;
  const data = [];
  
  for (let i = 0; i < points; i++) {
    // Generate realistic-looking trend data
    const variance = 0.3 + Math.random() * 0.4; // 30-70% of average
    const trend = Math.sin((i / points) * Math.PI * 2) * 0.2 + 1; // Sinusoidal trend
    const value = Math.round((totalValue / points) * variance * trend);
    data.push({ value: Math.max(0, value) });
  }
  
  return data;
}