import { json } from '@/lib/response';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  
  // Return deprecation notice
  return json({
    message: 'Embed tokens are no longer required. Images are now publicly accessible.',
    deprecationNotice: 'This endpoint is deprecated and will be removed in a future version.',
    imageUrl: `/api/websites/${websiteId}/image`,
    documentation: 'https://docs.umami.is/image-sharing',
    publicAccessNotice: 'All website analytics images are now publicly accessible without authentication.',
  });
}