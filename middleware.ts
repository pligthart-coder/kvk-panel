import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Authenticatie voor het KVK paneel met ondersteuning voor iframe embedding.
 *
 * Ondersteunt twee authenticatiemethoden:
 * 1. Access Token via query parameter (?token=xxx) - ideaal voor iframe embedding
 * 2. HTTP Basic Authentication - voor directe browser toegang
 *
 * Stel in via env vars:
 *   PANEL_ACCESS_TOKEN = een lange random string (voor iframe embedding)
 *   PANEL_USERNAME = username (voor basic auth, optioneel)
 *   PANEL_PASSWORD = password (voor basic auth, optioneel)
 *
 * Alle leeg/niet ingesteld = open toegang (alleen voor development).
 *
 * Voor Carerix iframe embedding:
 *   <iframe src="https://your-panel.vercel.app?token=YOUR_ACCESS_TOKEN"></iframe>
 */
export function middleware(req: NextRequest) {
  const accessToken = process.env.PANEL_ACCESS_TOKEN;
  const username = process.env.PANEL_USERNAME;
  const password = process.env.PANEL_PASSWORD;

  // Geen auth ingesteld → open toegang (alleen handig voor lokaal ontwikkelen).
  if (!accessToken && !username && !password) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[middleware] Geen authenticatie ingesteld — paneel is " +
          "publiek toegankelijk! Stel PANEL_ACCESS_TOKEN in via je hosting provider.",
      );
    }
    return NextResponse.next();
  }

  // Methode 1: Check access token in query parameter (voor iframe embedding)
  if (accessToken) {
    const url = new URL(req.url);
    const tokenParam = url.searchParams.get("token");
    if (tokenParam === accessToken) {
      return NextResponse.next();
    }
  }

  // Methode 2: Check basic auth (voor directe browser toegang)
  if (username && password) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Basic ")) {
      try {
        const decoded = atob(auth.slice(6));
        const sep = decoded.indexOf(":");
        const user = decoded.slice(0, sep);
        const pass = decoded.slice(sep + 1);
        if (user === username && pass === password) {
          return NextResponse.next();
        }
      } catch {
        // Ongeldige base64 — laat door naar 401 hieronder.
      }
    }
  }

  // Als basic auth is ingesteld, toon basic auth prompt
  // Anders toon gewoon een 401 (voor token-only mode)
  if (username && password) {
    return new NextResponse("Authenticatie vereist", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="KVK Paneel", charset="UTF-8"' },
    });
  }

  return new NextResponse("Authenticatie vereist - gebruik ?token=xxx parameter", {
    status: 401,
  });
}

export const config = {
  // Sluit Next.js interne routes en publieke assets uit van de auth-check,
  // anders zou je voor elk plaatje een login moeten doen.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
