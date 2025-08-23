import { promises as fs } from 'fs';
import path from 'path';

interface MessageDescriptor {
  id: string;
  defaultMessage: string;
}

interface Messages {
  [key: string]: MessageDescriptor | Messages;
}

// Cache for loaded messages
const messageCache = new Map<string, Messages>();

// Default messages (English)
const defaultMessages: Messages = {
  metrics: {
    pageviews: { id: 'label.page-views', defaultMessage: 'Page views' },
    visitors: { id: 'label.unique-visitors', defaultMessage: 'Unique visitors' },
    sessions: { id: 'label.sessions', defaultMessage: 'Sessions' },
    events: { id: 'label.events', defaultMessage: 'Events' },
    bounces: { id: 'label.bounce-rate', defaultMessage: 'Bounce rate' },
    duration: { id: 'label.visit-duration', defaultMessage: 'Visit duration' },
    views: { id: 'label.views', defaultMessage: 'Views' },
    countries: { id: 'label.countries', defaultMessage: 'Countries' },
    browsers: { id: 'label.browsers', defaultMessage: 'Browsers' },
    os: { id: 'label.os', defaultMessage: 'OS' },
    devices: { id: 'label.devices', defaultMessage: 'Devices' },
    languages: { id: 'label.languages', defaultMessage: 'Languages' },
    referrers: { id: 'label.referrers', defaultMessage: 'Referrers' },
    screens: { id: 'label.screens', defaultMessage: 'Screens' },
    regions: { id: 'label.regions', defaultMessage: 'Regions' },
    cities: { id: 'label.cities', defaultMessage: 'Cities' },
    hosts: { id: 'label.hosts', defaultMessage: 'Hosts' },
  },
  dateRange: {
    today: { id: 'label.today', defaultMessage: 'Today' },
    yesterday: { id: 'label.yesterday', defaultMessage: 'Yesterday' },
    thisWeek: { id: 'label.this-week', defaultMessage: 'This week' },
    thisMonth: { id: 'label.this-month', defaultMessage: 'This month' },
    thisYear: { id: 'label.this-year', defaultMessage: 'This year' },
    allTime: { id: 'label.all-time', defaultMessage: 'All time' },
    customRange: { id: 'label.custom-range', defaultMessage: 'Custom range' },
  },
};

// Map label keys to nested structure
function convertJsonToMessages(jsonData: any): Messages {
  const result: Messages = {
    metrics: {},
    dateRange: {},
  };

  // Map specific label keys to metrics
  const metricMappings: { [key: string]: string } = {
    'label.page-views': 'pageviews',
    'label.unique-visitors': 'visitors',
    'label.sessions': 'sessions',
    'label.events': 'events',
    'label.bounce-rate': 'bounces',
    'label.visit-duration': 'duration',
    'label.views': 'views',
    'label.countries': 'countries',
    'label.browsers': 'browsers',
    'label.os': 'os',
    'label.devices': 'devices',
    'label.languages': 'languages',
    'label.referrers': 'referrers',
    'label.screens': 'screens',
    'label.regions': 'regions',
    'label.cities': 'cities',
    'label.hosts': 'hosts',
  };

  // Map date range keys
  const dateRangeMappings: { [key: string]: string } = {
    'label.today': 'today',
    'label.yesterday': 'yesterday',
    'label.this-week': 'thisWeek',
    'label.this-month': 'thisMonth',
    'label.this-year': 'thisYear',
    'label.all-time': 'allTime',
    'label.custom-range': 'customRange',
  };

  // Process metrics
  Object.entries(metricMappings).forEach(([jsonKey, metricKey]) => {
    if (jsonData[jsonKey]) {
      const message = jsonData[jsonKey][0];
      if (result.metrics) {
        (result.metrics as Messages)[metricKey] = {
          id: message.id || jsonKey,
          defaultMessage: message.value || metricKey,
        };
      }
    }
  });

  // Process date ranges
  Object.entries(dateRangeMappings).forEach(([jsonKey, rangeKey]) => {
    if (jsonData[jsonKey]) {
      const message = jsonData[jsonKey][0];
      if (result.dateRange) {
        (result.dateRange as Messages)[rangeKey] = {
          id: message.id || jsonKey,
          defaultMessage: message.value || rangeKey,
        };
      }
    }
  });

  return result;
}

async function loadMessages(locale: string): Promise<Messages> {
  // Check cache first
  if (messageCache.has(locale)) {
    return messageCache.get(locale)!;
  }

  try {
    // Try to load the language file
    const filePath = path.join(process.cwd(), 'public', 'intl', 'messages', `${locale}.json`);
    const jsonData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    // Convert to our format
    const messages = convertJsonToMessages(jsonData);
    
    // Cache the result
    messageCache.set(locale, messages);
    
    return messages;
  } catch (error) {
    console.warn(`Failed to load messages for locale ${locale}:`, error);
    // Fall back to default messages
    return defaultMessages;
  }
}

export async function getServerMessages(locale: string = 'en-US'): Promise<Messages> {
  const messages = await loadMessages(locale);
  
  // Merge with defaults to ensure all keys exist
  return {
    metrics: {
      ...defaultMessages.metrics,
      ...(messages.metrics || {}),
    },
    dateRange: {
      ...defaultMessages.dateRange,
      ...(messages.dateRange || {}),
    },
  };
}

export function getMessage(messages: Messages, key: string, fallback?: string): string {
  const keys = key.split('.');
  let current: any = messages;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return fallback || key;
    }
  }
  
  return current?.defaultMessage || fallback || key;
}

// Pre-load common languages
const commonLocales = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'zh-CN', 'ja-JP'];
commonLocales.forEach(locale => {
  loadMessages(locale).catch(console.error);
});