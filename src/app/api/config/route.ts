import { getConfig } from '@/app/actions/getConfig';

export async function GET() {
  const config = await getConfig();

  return Response.json(config);
}
