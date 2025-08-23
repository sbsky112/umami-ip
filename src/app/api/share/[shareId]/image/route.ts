import { z } from 'zod';
import { parseRequest, getRequestDateRange } from '@/lib/request';
import { notFound, json, badRequest } from '@/lib/response';
import { getShareToken } from '@/lib/auth';
import { getWebsiteStats } from '@/queries';
import { getPageviewMetrics } from '@/queries/sql/pageviews/getPageviewMetrics';
import { SVGRenderer, RenderOptions } from '@/lib/image-templates/renderer';

const schema = z.object({
  type: z.enum(['metric', 'line-chart', 'bar-chart', 'pie-chart']),
  metric: z.enum(['pageviews', 'visitors', 'sessions', 'events', 'bounce-rate', 'duration']),
  period: z.enum(['day', 'week', 'month', 'year', 'custom']).optional(),
  startAt: z.coerce.number().int().optional(),
  endAt: z.coerce.number().int().optional(),
  width: z.coerce.number().int().min(100).max(2000).default(800),
  height: z.coerce.number().int().min(100).max(2000).default(400),
  theme: z.enum(['light', 'dark']).default('light'),
  format: z.enum(['svg', 'png']).default('svg'),
  title: z.string().optional(),
  showTitle: z.coerce.boolean().default(true),
  showValues: z.coerce.boolean().default(true),
  color: z.string().optional(),
});

const DEFAULT_COLORS = {
  light: {
    background: '#ffffff',
    text: '#374151',
    grid: '#e5e7eb',
    primary: '#3b82f6',
  },
  dark: {
    background: '#1f2937',
    text: '#f9fafb',
    grid: '#4b5563',
    primary: '#60a5fa',
  },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const { query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { shareId } = await params;
  const {
    type,
    metric,
    period = 'month',
    startAt,
    endAt,
    width,
    height,
    theme,
    format,
    title,
    showTitle,
    showValues,
    color,
  } = query;

  // Validate share token
  const shareToken = await getShareToken(shareId);

  if (!shareToken) {
    return notFound();
  }

  // Note: This route is deprecated. Use /api/websites/[websiteId]/image instead for public access.

  try {
    const { startDate, endDate } = await getRequestDateRange({
      startAt: startAt || Date.now() - getPeriodMillis(period),
      endAt: endAt || Date.now(),
    });

    // Fetch data based on metric type
    let data: any;
    let chartData: any;

    switch (metric) {
      case 'pageviews':
        const pageviews = await getPageviewMetrics(shareToken.websiteId, 'pageviews', {
          startDate,
          endDate,
          unit: getPeriodUnit(period),
        });
        
        if (type === 'metric') {
          const total = pageviews.reduce((sum, item) => sum + item.pageviews, 0);
          data = { value: total, label: 'Pageviews' };
        } else {
          chartData = {
            labels: pageviews.map(p => formatLabel(p.x, period)),
            datasets: [{
              label: 'Pageviews',
              data: pageviews.map(p => p.pageviews),
            }],
          };
        }
        break;

      case 'visitors':
        const stats = await getWebsiteStats(shareToken.websiteId, {
          startDate,
          endDate,
        });
        
        if (type === 'metric') {
          data = { 
            value: stats[0]?.uniques || 0, 
            label: 'Visitors',
            change: calculateChange(stats[0]?.uniques, stats[1]?.uniques),
          };
        }
        break;

      default:
        return badRequest('Unsupported metric');
    }

    // Prepare render options
    const colors = DEFAULT_COLORS[theme];
    const options: RenderOptions = {
      width,
      height,
      theme,
      title: title || getMetricLabel(metric),
      showTitle,
      showValues,
      color: color || colors.primary,
      backgroundColor: colors.background,
      textColor: colors.text,
      gridColor: colors.grid,
    };

    // Generate SVG
    const renderer = new SVGRenderer(width, height);
    let svg: string;

    switch (type) {
      case 'metric':
        svg = renderer.renderMetric(data, options);
        break;
      case 'line-chart':
        svg = renderer.renderLineChart(chartData, options);
        break;
      case 'bar-chart':
        svg = renderer.renderBarChart(chartData, options);
        break;
      default:
        svg = renderer.renderMetric(data, options);
    }

    // Return response
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    console.error(e);
    return badRequest('Failed to generate image');
  }
}

function getPeriodMillis(period: string): number {
  const now = Date.now();
  switch (period) {
    case 'day':
      return 24 * 60 * 60 * 1000;
    case 'week':
      return 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return 30 * 24 * 60 * 60 * 1000;
    case 'year':
      return 365 * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

function getPeriodUnit(period: string): string {
  switch (period) {
    case 'day':
      return 'hour';
    case 'week':
    case 'month':
      return 'day';
    case 'year':
      return 'month';
    default:
      return 'day';
  }
}

function formatLabel(date: Date, period: string): string {
  switch (period) {
    case 'day':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case 'week':
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'year':
      return date.toLocaleDateString('en-US', { month: 'short' });
    default:
      return date.toLocaleDateString('en-US');
  }
}

function getMetricLabel(metric: string): string {
  switch (metric) {
    case 'pageviews':
      return 'Pageviews';
    case 'visitors':
      return 'Visitors';
    case 'sessions':
      return 'Sessions';
    case 'events':
      return 'Events';
    case 'bounce-rate':
      return 'Bounce Rate';
    case 'duration':
      return 'Avg. Duration';
    default:
      return 'Analytics';
  }
}

function calculateChange(current: number, previous: number): number | undefined {
  if (!previous || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}