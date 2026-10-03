import { dispatch, snapshot } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await snapshot(), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  try {
    const action = await request.json();
    if (!action || typeof action !== 'object' || Array.isArray(action)) throw new Error('Nieprawidłowa akcja.');
    return Response.json(await dispatch(action), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Nie udało się zapisać zmiany.' }, { status: 400 });
  }
}
