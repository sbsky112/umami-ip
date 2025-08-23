'use client';

import React, { useState, useMemo } from 'react';
import { Button, TextField } from 'react-basics';
import { useApi } from '@/components/hooks/useApi';
import { useMessages } from '@/components/hooks/useMessages';
import styles from './ImageShare.module.css';

export interface ImageShareUrlProps {
  websiteId: string;
  shareId?: string;
}

export function ImageShareUrl({ websiteId, shareId }: ImageShareUrlProps) {
  const { formatMessage, labels } = useMessages();
  const { get } = useApi();
  const [url, setUrl] = useState('');
  
  const [params, setParams] = useState({
    type: 'metric',
    metric: 'pageviews',
    period: 'month',
    width: 800,
    height: 400,
    theme: 'light',
    showTitle: true,
    showValues: true,
    color: '#3b82f6',
    title: '',
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
  };

  const buildUrl = () => {
    const baseUrl = `${window.location.origin}/api/websites/${websiteId}/image`;
    
    const queryString = new URLSearchParams();
    
    // Map params to API format
    queryString.append('type', params.type === 'metric' ? 'badge' : 'chart');
    queryString.append('metric', params.metric.replace('-rate', 's').replace('-', ''));
    queryString.append('period', params.period);
    queryString.append('width', params.width);
    queryString.append('height', params.height);
    queryString.append('theme', params.theme);
    
    // Add custom parameters
    if (params.title) {
      queryString.append('title', params.title);
    }
    if (params.color && params.color !== '#3b82f6') {
      queryString.append('color', params.color);
    }
    queryString.append('showTitle', params.showTitle);
    queryString.append('showValues', params.showValues);
    
    if (shareId) {
      queryString.append('shareId', shareId);
    }
    
    return `${baseUrl}?${queryString.toString()}`;
  };

  React.useEffect(() => {
    setUrl(buildUrl());
  }, [params, websiteId, shareId]);

  const imagePreview = useMemo(() => {
    return (
      <div className={styles.preview}>
        <img 
          src={url} 
          alt={formatMessage(labels.analyticsPreview)} 
          className={styles.image}
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIgcng9IjgiLz48dGV4dCB4PSI0MDAiIHk9IjIwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY5NzA4ZCIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9IjUwMCI+UHJldmlldyBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
          }}
        />
      </div>
    );
  }, [url]);

  return (
    <div className={styles.container}>
      <div className={styles.options}>
        <div className={styles.optionsSection}>
          <div className={styles.sectionTitle}>{formatMessage(labels.type)}</div>
          <select
            value={params.type}
            onChange={(e) => setParams({ ...params, type: e.target.value as any })}
            className={styles.select}
          >
            <option value="metric">{formatMessage(labels.badge)}</option>
            <option value="line-chart">{formatMessage(labels.chart)}</option>
          </select>
        </div>

        <div className={styles.optionsSection}>
          <div className={styles.sectionTitle}>{formatMessage(labels.metric)}</div>
          <select
            value={params.metric}
            onChange={(e) => setParams({ ...params, metric: e.target.value as any })}
            className={styles.select}
          >
            <option value="pageviews">{formatMessage(labels.pageviews)}</option>
            <option value="visitors">{formatMessage(labels.visitors)}</option>
            <option value="sessions">{formatMessage(labels.sessions)}</option>
            <option value="bounces">{formatMessage(labels.bounce)}</option>
            <option value="duration">{formatMessage(labels.averageVisitTime)}</option>
          </select>
        </div>

        <div className={styles.optionsSection}>
          <div className={styles.sectionTitle}>{formatMessage(labels.period)}</div>
          <select
            value={params.period}
            onChange={(e) => setParams({ ...params, period: e.target.value as any })}
            className={styles.select}
          >
            <option value="day">{formatMessage(labels.today)}</option>
            <option value="week">{formatMessage(labels.lastWeek)}</option>
            <option value="month">{formatMessage(labels.lastMonth)}</option>
            <option value="year">{formatMessage(labels.lastYear)}</option>
          </select>
        </div>

        <div className={styles.optionsSection}>
          <div className={styles.sectionTitle}>{formatMessage(labels.theme)}</div>
          <select
            value={params.theme}
            onChange={(e) => setParams({ ...params, theme: e.target.value as any })}
            className={styles.select}
          >
            <option value="light">{formatMessage(labels.light)}</option>
            <option value="dark">{formatMessage(labels.dark)}</option>
          </select>
        </div>

        <div className={styles.optionsSection}>
          <div className={styles.sectionTitle}>{formatMessage(labels.dimensions)}</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <TextField
              type="number"
              value={params.width}
              onChange={(e) => setParams({ ...params, width: parseInt(e.target.value) || 800 })}
              className={styles.input}
              placeholder={formatMessage(labels.width)}
            />
            <TextField
              type="number"
              value={params.height}
              onChange={(e) => setParams({ ...params, height: parseInt(e.target.value) || 400 })}
              className={styles.input}
              placeholder={formatMessage(labels.height)}
            />
          </div>
        </div>

        <div className={styles.optionsSection}>
          <div className={styles.sectionTitle}>{formatMessage(labels.title)}</div>
          <TextField
            value={params.title}
            onChange={(e) => setParams({ ...params, title: e.target.value })}
            placeholder={formatMessage(labels.customTitle)}
            className={styles.input}
          />
        </div>

        <div className={styles.optionsSection}>
          <div className={styles.sectionTitle}>{formatMessage(labels.primaryColor)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="color"
              value={params.color}
              onChange={(e) => setParams({ ...params, color: e.target.value })}
              className={styles.colorPicker}
            />
            <span style={{ fontSize: '14px', color: 'var(--base600)' }}>{params.color}</span>
          </div>
        </div>

        <div className={styles.optionsSection}>
          <div className={styles.sectionTitle}>{formatMessage(labels.options)}</div>
          <div className={styles.checkboxes}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={params.showTitle}
                onChange={(e) => setParams({ ...params, showTitle: e.target.checked })}
              />
              {formatMessage(labels.showTitle)}
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={params.showValues}
                onChange={(e) => setParams({ ...params, showValues: e.target.checked })}
              />
              {formatMessage(labels.showValues)}
            </label>
          </div>
        </div>
      </div>

      <div className={styles.previewSection}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--base800)', fontSize: '18px' }}>
          {formatMessage(labels.analyticsPreview)}
        </h3>
        <div className={styles.urlContainer}>
          <TextField
            value={url}
            readOnly
            className={styles.urlInput}
          />
          <Button onClick={handleCopy} variant="primary">
            {formatMessage(labels.copy)}
          </Button>
        </div>
        
        {imagePreview}
        
        <div className={styles.markdownExample}>
          <h4>{formatMessage(labels.markdownExample)}:</h4>
          <pre>
            <code>
{`![Analytics](${url})`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}