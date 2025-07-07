// This route is now handled by the main /api/room-participants/route.ts file.
// Please use that endpoint for join/leave actions.

export const dynamic = 'error';
export function GET() {
  return new Response('Not implemented. Use /api/room-participants instead.', { status: 404 });
}
export function POST() {
  return new Response('Not implemented. Use /api/room-participants instead.', { status: 404 });
}