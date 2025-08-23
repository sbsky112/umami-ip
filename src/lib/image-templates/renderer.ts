export interface RenderOptions {
  width: number;
  height: number;
  theme: 'light' | 'dark';
  title?: string;
  showTitle: boolean;
  showValues: boolean;
  color: string;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
}

export interface MetricData {
  value: number;
  change?: number;
  label: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export interface PieData {
  labels: string[];
  data: number[];
  colors: string[];
}

export class SVGRenderer {
  private width: number;
  private height: number;
  private padding: number = 40;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  renderMetric(data: MetricData, options: RenderOptions): string {
    const { width, height } = this;
    const { title, showTitle, showValues, color, backgroundColor, textColor } = options;
    
    const changeColor = data.change && data.change > 0 ? '#10b981' : '#ef4444';
    const changeSymbol = data.change && data.change > 0 ? '+' : '';
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${backgroundColor}" rx="8"/>
  
  ${showTitle ? `<text x="${width/2}" y="30" text-anchor="middle" fill="${textColor}" font-size="18" font-weight="600">${title || 'Analytics'}</text>` : ''}
  
  <text x="${width/2}" y="${showTitle ? height/2 + 10 : height/2}" text-anchor="middle" fill="${color}" font-size="48" font-weight="700">
    ${this.formatNumber(data.value)}
  </text>
  
  <text x="${width/2}" y="${showTitle ? height/2 + 50 : height/2 + 40}" text-anchor="middle" fill="${textColor}" font-size="16" opacity="0.8">
    ${data.label}
  </text>
  
  ${showValues && data.change !== undefined ? `
    <text x="${width/2}" y="${height - 30}" text-anchor="middle" fill="${changeColor}" font-size="14" font-weight="500">
      ${changeSymbol}${data.change.toFixed(1)}%
    </text>
  ` : ''}
</svg>`;
  }

  renderLineChart(data: ChartData, options: RenderOptions): string {
    const { width, height, padding } = this;
    const { title, showTitle, color, backgroundColor, textColor, gridColor } = options;
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2 - (showTitle ? 30 : 0);
    const titleOffset = showTitle ? 30 : 0;
    
    const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
    const minValue = Math.min(...data.datasets.flatMap(d => d.data));
    const valueRange = maxValue - minValue || 1;
    
    const points = data.datasets[0].data.map((value, index) => {
      const x = padding + (index / (data.labels.length - 1)) * chartWidth;
      const y = padding + titleOffset + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    const gridLines = Array.from({ length: 5 }, (_, i) => {
      const y = padding + titleOffset + (i / 4) * chartHeight;
      return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="${gridColor}" stroke-width="1" opacity="0.3"/>`;
    }).join('\n    ');
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${backgroundColor}" rx="8"/>
  
  ${showTitle ? `<text x="${width/2}" y="25" text-anchor="middle" fill="${textColor}" font-size="16" font-weight="600">${title || 'Trend'}</text>` : ''}
  
  <g transform="translate(0, ${titleOffset})">
    ${gridLines}
    
    <polyline
      points="${points}"
      fill="none"
      stroke="${color}"
      stroke-width="3"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
    
    ${points.split(' ').map((point, i) => {
      const [x, y] = point.split(',');
      return `<circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`;
    }).join('\n    ')}
  </g>
</svg>`;
  }

  renderBarChart(data: ChartData, options: RenderOptions): string {
    const { width, height, padding } = this;
    const { title, showTitle, color, backgroundColor, textColor, gridColor } = options;
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2 - (showTitle ? 30 : 0);
    const titleOffset = showTitle ? 30 : 0;
    
    const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
    const barWidth = chartWidth / data.labels.length * 0.8;
    const barSpacing = chartWidth / data.labels.length;
    
    const bars = data.datasets[0].data.map((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
      const y = padding + titleOffset + chartHeight - barHeight;
      
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
        ${options.showValues ? `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" fill="${textColor}" font-size="12">${this.formatNumber(value)}</text>` : ''}
      `;
    }).join('\n    ');
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${backgroundColor}" rx="8"/>
  
  ${showTitle ? `<text x="${width/2}" y="25" text-anchor="middle" fill="${textColor}" font-size="16" font-weight="600">${title || 'Analytics'}</text>` : ''}
  
  <g transform="translate(0, ${titleOffset})">
    <line x1="${padding}" y1="${padding + chartHeight}" x2="${width - padding}" y2="${padding + chartHeight}" stroke="${gridColor}" stroke-width="1"/>
    
    ${bars}
  </g>
</svg>`;
  }

  renderPieChart(data: PieData, options: RenderOptions): string {
    const { width, height } = this;
    const { title, showTitle, backgroundColor, textColor } = options;
    
    const centerX = width / 2;
    const centerY = height / 2 + (showTitle ? 15 : 0);
    const radius = Math.min(width, height) / 3;
    
    const total = data.data.reduce((sum, value) => sum + value, 0);
    let currentAngle = -Math.PI / 2;
    
    const slices = data.data.map((value, index) => {
      const percentage = value / total;
      const angle = percentage * Math.PI * 2;
      const endAngle = currentAngle + angle;
      
      const x1 = centerX + Math.cos(currentAngle) * radius;
      const y1 = centerY + Math.sin(currentAngle) * radius;
      const x2 = centerX + Math.cos(endAngle) * radius;
      const y2 = centerY + Math.sin(endAngle) * radius;
      
      const largeArc = angle > Math.PI ? 1 : 0;
      
      const path = `
        M ${centerX} ${centerY}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
        Z
      `;
      
      currentAngle = endAngle;
      
      return `
        <path d="${path}" fill="${data.colors[index] || data.colors[index % data.colors.length]}"/>
        ${options.showValues ? `
          <text x="${centerX + Math.cos(currentAngle - angle/2) * radius * 0.7}" 
                y="${centerY + Math.sin(currentAngle - angle/2) * radius * 0.7}" 
                text-anchor="middle" fill="white" font-size="14" font-weight="600">
            ${Math.round(percentage * 100)}%
          </text>
        ` : ''}
      `;
    }).join('\n    ');
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${backgroundColor}" rx="8"/>
  
  ${showTitle ? `<text x="${width/2}" y="25" text-anchor="middle" fill="${textColor}" font-size="16" font-weight="600">${title || 'Distribution'}</text>` : ''}
  
  ${slices}
</svg>`;
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return Math.round(num).toString();
  }
}