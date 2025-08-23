import {
  Form,
  FormRow,
  FormButtons,
  Flexbox,
  TextField,
  Button,
  Toggle,
  LoadingButton,
  Dropdown,
  Item,
} from 'react-basics';
import { useContext, useState } from 'react';
import { useApi, useMessages, useModified } from '@/components/hooks';
import { WebsiteContext } from '@/app/(main)/websites/[websiteId]/WebsiteProvider';

export function ShareImage({ hostUrl, onSave }: { hostUrl?: string; onSave?: () => void }) {
  const website = useContext(WebsiteContext);
  const { formatMessage, labels } = useMessages();
  const [id, setId] = useState(website.shareId);
  const [imageType, setImageType] = useState<'badge' | 'chart'>('badge');
  const [metric, setMetric] = useState('pageviews');
  const [period, setPeriod] = useState('month');
  const [theme, setTheme] = useState('light');
  const { post, useMutation } = useApi();
  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post(`/websites/${website.id}`, data),
  });
  const { touch } = useModified();

  const url = `${hostUrl || window?.location.origin || ''}${
    process.env.basePath || ''
  }/api/websites/${website.id}/image?type=${imageType}&metric=${metric}&period=${period}&theme=${theme}&shareId=${id}`;

  const handleGenerate = () => {
    if (id) {
      const data = {
        name: website.name,
        domain: website.domain,
        shareId: null,
      };
      mutate(data, {
        onSuccess: async () => {
          touch(`website:${website.id}`);
          onSave?.();
        },
      });
      setId(null);
    } else {
      // Generate new share ID
      const newId = Math.random().toString(36).substring(2, 15);
      const data = {
        name: website.name,
        domain: website.domain,
        shareId: newId,
      };
      mutate(data, {
        onSuccess: async () => {
          touch(`website:${website.id}`);
          onSave?.();
        },
      });
      setId(newId);
    }
  };

  const handleSave = () => {
    mutate(
      { name: website.name, domain: website.domain, shareId: id },
      {
        onSuccess: async () => {
          touch(`website:${website.id}`);
          onSave?.();
        },
      },
    );
  };

  const metricOptions = [
    { value: 'pageviews', label: formatMessage(labels.pageviews) },
    { value: 'visitors', label: formatMessage(labels.visitors) },
    { value: 'sessions', label: formatMessage(labels.sessions) },
    { value: 'bounces', label: formatMessage(labels.bounce) },
    { value: 'duration', label: formatMessage(labels.averageVisitTime) },
  ];

  const periodOptions = [
    { value: 'day', label: formatMessage(labels.today) },
    { value: 'week', label: formatMessage(labels.lastWeek) },
    { value: 'month', label: formatMessage(labels.lastMonth) },
    { value: 'year', label: formatMessage(labels.lastYear) },
  ];

  const themeOptions = [
    { value: 'light', label: formatMessage(labels.light) },
    { value: 'dark', label: formatMessage(labels.dark) },
  ];

  return (
    <>
      <Toggle checked={Boolean(id)} onChecked={handleGenerate} style={{ marginBottom: 30 }}>
        {formatMessage(labels.enableShareImage)}
      </Toggle>
      {id && (
        <Form error={error}>
          <FormRow label={formatMessage(labels.imageType)}>
            <Dropdown
              items={[
                { value: 'badge', label: formatMessage(labels.badge) },
                { value: 'chart', label: formatMessage(labels.chart) },
              ]}
              value={imageType}
              onChange={value => setImageType(value as 'badge' | 'chart')}
            >
              {({ value, label }) => <Item key={value}>{label}</Item>}
            </Dropdown>
          </FormRow>
          
          <FormRow label={formatMessage(labels.metric)}>
            <Dropdown items={metricOptions} value={metric} onChange={value => setMetric(value)}>
              {({ value, label }) => <Item key={value}>{label}</Item>}
            </Dropdown>
          </FormRow>
          
          <FormRow label={formatMessage(labels.period)}>
            <Dropdown items={periodOptions} value={period} onChange={value => setPeriod(value)}>
              {({ value, label }) => <Item key={value}>{label}</Item>}
            </Dropdown>
          </FormRow>
          
          <FormRow label={formatMessage(labels.theme)}>
            <Dropdown items={themeOptions} value={theme} onChange={value => setTheme(value)}>
              {({ value, label }) => <Item key={value}>{label}</Item>}
            </Dropdown>
          </FormRow>
          
          <FormRow label={formatMessage(labels.imageUrl)}>
            <TextField value={url} readOnly allowCopy />
          </FormRow>
          
          <FormRow label={formatMessage(labels.preview)}>
            <div style={{ padding: '20px', backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6', borderRadius: '8px' }}>
              <img 
                src={url} 
                alt={formatMessage(labels.analyticsPreview)}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </FormRow>
          
          <FormButtons>
            <LoadingButton
              variant="primary"
              disabled={id === website.shareId}
              isLoading={isPending}
              onClick={handleSave}
            >
              {formatMessage(labels.save)}
            </LoadingButton>
          </FormButtons>
        </Form>
      )}
    </>
  );
}

export default ShareImage;