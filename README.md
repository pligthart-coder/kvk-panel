# KVK Paneel — Stap 1

Een Next.js paneel dat bedrijven opzoekt via de **KVK Basisprofiel API**.
Beschermd met basic auth, klaar om veilig te hosten.

> **Volgende stap:** in stap 2 voegen we de Carerix-integratie toe (check of
> opdrachtgever bestaat, aanmaken, deeplink openen). Voor nu eerst dit deel
> stabiel werkend krijgen.

---

## Quick start (2 minuten, met fake KVK-data)

```bash
unzip kvk-panel.zip && cd kvk-panel
npm install
cp .env.local.example .env.local       # blijft op "mock" staan
npm run dev
```

Open http://localhost:3000 en zoek bijv. `69599084` of `33191000`.

---

## Echte KVK-data (test-API, ook gratis)

KVK biedt een **test-omgeving** met fake bedrijfsdata, vrij toegankelijk
zonder certificaat. Perfect om de hele integratie te testen voordat je naar
productie gaat.

In `.env.local`:
```env
KVK_API_KEY=l7xx1f2691f2520d487b902f4e0b57a0b227
KVK_API_BASE_URL=https://api.kvk.nl/test/api/v1
```

> Deze test-API-key is publiek door KVK gedeeld in hun documentatie. De
> data is fake — handig om te zien hoe een echte response eruitziet. Test
> nummers zoals `90004341`, `90000022` of `68750110` werken hier.

---

## Productie KVK-data

Hiervoor heb je drie dingen nodig:

1. **Account op het [KVK Developer Portal](https://developers.kvk.nl)**
   - Maak een aanvraag voor toegang tot de **Basisprofiel API**
   - Je krijgt een eigen `apikey`
2. **PKIoverheid Services Server certificaat**
   - Aan te schaffen bij een TSP (Trusted Service Provider) zoals KPN of
     QuoVadis
   - Nodig: een geverifieerd KVK-nummer + eHerkenning niveau 3 of hoger
   - Doorlooptijd: 1–3 weken, kosten ~€200–400/jaar
3. **Een hosting-omgeving die mTLS ondersteunt**
   - Vercel's standaard runtime werkt **niet** met client-certificaten
   - Wel mogelijk: Railway, Fly.io, een eigen VPS, of Vercel met een eigen
     proxy (bijv. Cloudflare Worker als KVK-relay)

In code: `lib/kvk.ts` werkt nu met `fetch()`. Voor mTLS moet je een Node
`https.Agent` toevoegen met je `cert` en `key`. Voorbeeld in de code-comments
van `lib/kvk.ts`.

---

## Veilig hosten — keuzes

### Aanbevolen: Vercel + test-API + basic auth

Snelste en gratis pad voor de test-omgeving. Productie KVK kan hier niet
direct vanwege mTLS, maar daar kun je later een proxy voor opzetten.

```bash
# Push je code naar GitHub
git init && git add . && git commit -m "Initial commit"
gh repo create kvk-panel --private --source=. --push   # of via web

# Deploy naar Vercel
npx vercel
# Volg de prompts; kies een nieuw project
```

Daarna in het **Vercel dashboard → Settings → Environment Variables** zet je:

| Variable           | Waarde                                          |
| ------------------ | ----------------------------------------------- |
| `KVK_API_KEY`      | je test-key (zie boven)                         |
| `KVK_API_BASE_URL` | `https://api.kvk.nl/test/api/v1`                |
| `PANEL_USERNAME`   | bijv. `team`                                    |
| `PANEL_PASSWORD`   | iets sterks (gebruik een password manager)      |

Klik *Redeploy*. Vercel geeft je een HTTPS-URL met automatisch SSL-certificaat.

### Productie-pad: eigen VPS (DigitalOcean / Hetzner / Linode)

Als je productie-KVK met mTLS wilt:

```bash
# Op je server (Ubuntu 22.04+)
sudo apt update && sudo apt install -y nodejs npm caddy
git clone <jouw-repo> && cd kvk-panel
npm install && npm run build

# .env productiewaardes invullen, plus paden naar je certificaat
echo "KVK_CERT_PATH=/etc/kvk/cert.pem" >> .env.local
echo "KVK_KEY_PATH=/etc/kvk/key.pem" >> .env.local

# Start als service (gebruik pm2 of systemd)
npm install -g pm2
pm2 start npm --name kvk-panel -- start
pm2 save && pm2 startup
```

Caddy als reverse proxy met automatisch HTTPS:

```caddy
kvk.jouwdomein.nl {
    reverse_proxy localhost:3000
}
```

---

## Veiligheidsoverwegingen

**Wat goed geregeld is:**

- ✅ KVK-key staat alleen server-side (in env vars), nooit in browser
- ✅ Basic auth op het hele paneel via Next.js middleware
- ✅ Input wordt gevalideerd (8 cijfers) voordat de KVK-call wordt gedaan
- ✅ Caching uitgeschakeld op API-routes (`cache: "no-store"`)
- ✅ HTTPS automatisch via Vercel/Caddy

**Wat je nog kunt overwegen:**

- **Rate limiting** — voorkomt dat een gecompromitteerde basic-auth account
  je KVK-quota opmaakt. Met Vercel: gebruik [@upstash/ratelimit](https://upstash.com/docs/ratelimit). Voor een intern tool met 5 gebruikers: niet kritiek.
- **Auditlog** — wie heeft welk KVK-nummer opgevraagd? Een simpele log naar
  bijv. Axiom of een database. Niet nodig voor v1.
- **SSO** in plaats van basic auth — als je organisatie Google Workspace of
  Microsoft 365 heeft, is het mooier om dat te gebruiken. Stap 2 of later.

---

## Bestandsstructuur

```
app/
├── page.tsx                         ← UI paneel (client component)
├── layout.tsx
├── globals.css
└── api/
    └── kvk/[kvkNumber]/route.ts     ← server-side KVK proxy

lib/
├── types.ts                         ← KvkCompany type
└── kvk.ts                           ← KVK client + mock + mapping

middleware.ts                        ← basic auth voor het hele paneel
```

---

## Scripts

- `npm run dev` — dev server met hot reload
- `npm run build` — productie build
- `npm run start` — productie server
- `npm run typecheck` — TS-check zonder build

---

## Wat komt er in stap 2?

- Carerix GraphQL integratie (zie de eerdere chat-context — schema is al
  uitgezocht)
- Knop *Aanmaken in Carerix* / *Openen in Carerix*
- Mapping van KVK-velden naar `CRCompany` (`kvkNumber`, `visitStreet`, etc.)
- OAuth2 client-credentials flow voor Carerix-token-refresh
