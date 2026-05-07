import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * HTTP Basic Authentication voor het hele paneel.
 *
 * Waarom: zodra dit paneel online staat, kan iedereen die de URL kent jouw
 * KVK API-quota opmaken. Basic auth is voor een intern tool de simpelste
 * effectieve bescherming — browsers onthouden de credentials, geen DB nodig.
 *
 * Stel in via env vars:
 *   PANEL_USERNAME = ...
 *   PANEL_PASSWORD = ...
 *
 * Beide leeg/niet ingesteld = open toegang. Dat geeft een waarschuwing in de
 * console maar blokkeert niet, zodat lokale ontwikkeling zonder auth werkt.
 *
 * Belangrijke aandachtspunten:
 *  - Werkt alleen veilig over HTTPS (Vercel doet dit automatisch).
 *  - Plain string-compare is technisch vatbaar voor timing attacks; voor een
 *    intern tool met HTTPS is dit acceptabel. Voor publieke toepassingen:
 *    gebruik een echte auth-laag (NextAuth/Clerk/SSO).
 */
export function middleware(req: NextRequest) {
  const username = process.env.PANEL_USERNAME;
  const password = process.env.PANEL_PASSWORD;

  // Geen auth ingesteld → open toegang (alleen handig voor lokaal ontwikkelen).
  if (!username || !password) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[middleware] PANEL_USERNAME/PASSWORD niet ingesteld — paneel is " +
          "publiek toegankelijk! Stel dit in via je hosting provider.",
      );
    }
    return NextResponse.next();
  }

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

  return new NextResponse("Authenticatie vereist", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="KVK Paneel", charset="UTF-8"' },
  });
}

export const config = {
  // Sluit Next.js interne routes en publieke assets uit van de auth-check,
  // anders zou je voor elk plaatje een login moeten doen.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
