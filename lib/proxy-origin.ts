import type { NextRequest } from "next/server"

/**
 * Resolve the upstream origin for proxy routes.
 *
 * The widget bundle is served from the same app as the API, so proxy routes
 * forward to this app's own /api endpoints. NEXT_PUBLIC_URL wins when set so a
 * split deployment can point at a dedicated backend origin.
 */
export function resolveUpstreamOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_URL?.trim()
  if (configured) {
    return configured.replace(/\/+$/, "")
  }

  return req.nextUrl.origin.replace(/\/+$/, "")
}