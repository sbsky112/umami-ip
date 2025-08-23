import { EVENT_NAME_LENGTH, URL_LENGTH, EVENT_TYPE, PAGE_TITLE_LENGTH } from '@/lib/constants';
import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import clickhouse from '@/lib/clickhouse';
import kafka from '@/lib/kafka';
import prisma from '@/lib/prisma';
import { uuid } from '@/lib/crypto';
import { saveEventData } from './saveEventData';
import { saveRevenue } from './saveRevenue';

export interface SaveEventArgs {
  websiteId: string;
  sessionId: string;
  visitId: string;
  createdAt?: Date;

  // Page
  pageTitle?: string;
  hostname?: string;
  urlPath: string;
  urlQuery?: string;
  referrerPath?: string;
  referrerQuery?: string;
  referrerDomain?: string;

  // Session
  distinctId?: string;
  browser?: string;
  os?: string;
  device?: string;
  screen?: string;
  language?: string;
  country?: string;
  region?: string;
  city?: string;
  ipAddress?: string;

  // Events
  eventName?: string;
  eventData?: any;
  tag?: string;

  // UTM
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  // Click IDs
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  lifatid?: string;
  twclid?: string;
}

export async function saveEvent(args: SaveEventArgs) {
  try {
    console.log(`🎯 saveEvent called with: ${JSON.stringify({
      websiteId: args.websiteId,
      sessionId: args.sessionId,
      visitId: args.visitId,
      eventName: args.eventName,
      urlPath: args.urlPath,
      pageTitle: args.pageTitle,
      hasEventData: !!args.eventData,
    }, null, 2)}`);
    
    const result = await runQuery({
      [PRISMA]: () => relationalQuery(args),
      [CLICKHOUSE]: () => clickhouseQuery(args),
    });
    
    console.log(`✅ saveEvent completed successfully`);
    return result;
  } catch (error) {
    console.error('❌ saveEvent failed:', error);
    console.error('Error details:', {
      name: (error as any).name,
      message: (error as any).message,
      code: (error as any).code,
      stack: (error as any).stack,
    });
    throw error;
  }
}

async function relationalQuery({
  websiteId,
  sessionId,
  visitId,
  createdAt,
  pageTitle,
  tag,
  hostname,
  urlPath,
  urlQuery,
  referrerPath,
  referrerQuery,
  referrerDomain,
  eventName,
  eventData,
  utmSource,
  utmMedium,
  utmCampaign,
  utmContent,
  utmTerm,
  gclid,
  fbclid,
  msclkid,
  ttclid,
  lifatid,
  twclid,
}: SaveEventArgs) {
  try {
    console.log(`🗄️ Using relationalQuery for database operation`);
    const websiteEventId = uuid();
    
    console.log(`📝 Creating website event with ID: ${websiteEventId}`);
    
    const eventDataToCreate = {
      id: websiteEventId,
      websiteId,
      sessionId,
      visitId,
      urlPath: urlPath ? urlPath.substring(0, URL_LENGTH) : urlPath,
      urlQuery: urlQuery ? urlQuery.substring(0, URL_LENGTH) : urlQuery,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      referrerPath: referrerPath ? referrerPath.substring(0, URL_LENGTH) : referrerPath,
      referrerQuery: referrerQuery ? referrerQuery.substring(0, URL_LENGTH) : referrerQuery,
      referrerDomain: referrerDomain ? referrerDomain.substring(0, URL_LENGTH) : referrerDomain,
      pageTitle: pageTitle ? pageTitle.substring(0, PAGE_TITLE_LENGTH) : pageTitle,
      gclid,
      fbclid,
      msclkid,
      ttclid,
      lifatid,
      twclid,
      eventType: eventName ? EVENT_TYPE.customEvent : EVENT_TYPE.pageView,
      eventName: eventName ? eventName.substring(0, EVENT_NAME_LENGTH) : null,
      tag,
      hostname,
      createdAt,
    };
    
    console.log(`💾 Creating website event in database: ${JSON.stringify(eventDataToCreate, null, 2)}`);
    
    await prisma.client.websiteEvent.create({
      data: eventDataToCreate,
    });
    
    console.log(`✅ Website event created successfully`);

  if (eventData) {
    console.log(`📊 Processing event data: ${JSON.stringify(eventData, null, 2)}`);
    
    await saveEventData({
      websiteId,
      sessionId,
      eventId: websiteEventId,
      urlPath: urlPath ? urlPath.substring(0, URL_LENGTH) : urlPath,
      eventName: eventName ? eventName.substring(0, EVENT_NAME_LENGTH) : null,
      eventData,
      createdAt,
    });
    
    console.log(`✅ Event data saved successfully`);

    const { revenue, currency } = eventData;

    if (revenue > 0 && currency) {
      console.log(`💰 Processing revenue data: ${revenue} ${currency}`);
      
      await saveRevenue({
        websiteId,
        sessionId,
        eventId: websiteEventId,
        eventName: eventName ? eventName.substring(0, EVENT_NAME_LENGTH) : null,
        currency,
        revenue,
        createdAt,
      });
      
      console.log(`✅ Revenue data saved successfully`);
    }
  }
  } catch (error) {
    console.error('❌ relationalQuery failed:', error);
    console.error('Error details:', {
      name: (error as any).name,
      message: (error as any).message,
      code: (error as any).code,
      stack: (error as any).stack,
    });
    throw error;
  }
}

async function clickhouseQuery({
  websiteId,
  sessionId,
  visitId,
  distinctId,
  createdAt,
  pageTitle,
  browser,
  os,
  device,
  screen,
  language,
  country,
  region,
  city,
  ipAddress,
  tag,
  hostname,
  urlPath,
  urlQuery,
  referrerPath,
  referrerQuery,
  referrerDomain,
  eventName,
  eventData,
  utmSource,
  utmMedium,
  utmCampaign,
  utmContent,
  utmTerm,
  gclid,
  fbclid,
  msclkid,
  ttclid,
  lifatid,
  twclid,
}: SaveEventArgs) {
  const { insert, getUTCString } = clickhouse;
  const { sendMessage } = kafka;
  const eventId = uuid();

  const message = {
    website_id: websiteId,
    session_id: sessionId,
    visit_id: visitId,
    event_id: eventId,
    country: country,
    region: country && region ? (region.includes('-') ? region : `${country}-${region}`) : null,
    city: city,
    ip_address: ipAddress,
    url_path: urlPath ? urlPath.substring(0, URL_LENGTH) : urlPath,
    url_query: urlQuery ? urlQuery.substring(0, URL_LENGTH) : urlQuery,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    referrer_path: referrerPath ? referrerPath.substring(0, URL_LENGTH) : referrerPath,
    referrer_query: referrerQuery ? referrerQuery.substring(0, URL_LENGTH) : referrerQuery,
    referrer_domain: referrerDomain ? referrerDomain.substring(0, URL_LENGTH) : referrerDomain,
    page_title: pageTitle ? pageTitle.substring(0, PAGE_TITLE_LENGTH) : pageTitle,
    gclid: gclid,
    fbclid: fbclid,
    msclkid: msclkid,
    ttclid: ttclid,
    li_fat_id: lifatid,
    twclid: twclid,
    event_type: eventName ? EVENT_TYPE.customEvent : EVENT_TYPE.pageView,
    event_name: eventName ? eventName.substring(0, EVENT_NAME_LENGTH) : null,
    tag: tag,
    distinct_id: distinctId,
    created_at: getUTCString(createdAt),
    browser,
    os,
    device,
    screen,
    language,
    hostname,
  };

  if (kafka.enabled) {
    await sendMessage('event', message);
  } else {
    await insert('website_event', [message]);
  }

  if (eventData) {
    await saveEventData({
      websiteId,
      sessionId,
      eventId,
      urlPath: urlPath ? urlPath.substring(0, URL_LENGTH) : urlPath,
      eventName: eventName ? eventName.substring(0, EVENT_NAME_LENGTH) : null,
      eventData,
      createdAt,
    });
  }
}