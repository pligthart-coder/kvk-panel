# KVK Panel - Deployment Guide voor Carerix Embedding

## Stap 1: Deploy naar Vercel

### Via Vercel Website (Makkelijkst)

1. **Ga naar [vercel.com](https://vercel.com)** en log in met GitHub
2. Klik op **"Add New Project"**
3. **Import deze Git repository:**
   - Push eerst je code naar GitHub:
     ```bash
     # Maak een nieuwe GitHub repo aan via https://github.com/new
     # Dan:
     git remote add origin https://github.com/jouw-username/kvk-panel.git
     git push -u origin main
     ```
   - Of upload de folder direct via Vercel's interface

4. **Project instellingen:**
   - Framework Preset: **Next.js** (wordt automatisch gedetecteerd)
   - Root Directory: `./` (standaard)
   - Build Command: `npm run build` (standaard)
   - Output Directory: `.next` (standaard)

5. Klik op **"Deploy"**

### Via Vercel CLI (Alternatief)

```bash
# Installeer Vercel CLI (eenmalig)
npm install -g vercel

# Of gebruik npx (geen installatie nodig)
npx vercel

# Volg de prompts:
# - Set up and deploy? Yes
# - Which scope? (kies je account)
# - Link to existing project? No
# - Project name? kvk-panel-carerix
# - Directory? ./
# - Override settings? No

# Voor productie deployment:
npx vercel --prod
```

---

## Stap 2: Environment Variables Instellen

Na deployment, ga naar je **Vercel Dashboard → Project → Settings → Environment Variables**

Voeg de volgende variabelen toe:

### Verplicht - KVK API

| Variable | Value | Environment |
|----------|-------|-------------|
| `KVK_API_KEY` | `l7xx1f2691f2520d487b902f4e0b57a0b197` | Production, Preview, Development |
| `KVK_API_BASE_URL` | `https://api.kvk.nl/test/api/v1` | Production, Preview, Development |

### Verplicht - Authenticatie voor Carerix

| Variable | Value | Environment |
|----------|-------|-------------|
| `PANEL_ACCESS_TOKEN` | *genereer een random token (zie onder)* | Production, Preview, Development |

**Genereer een veilige access token:**
```bash
# Op Mac/Linux:
openssl rand -hex 32

# Of gebruik een password generator
# Voorbeeld: a7f8d9e2c1b4a5f6e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0
```

### Optioneel - Basic Auth (voor directe browser toegang)

| Variable | Value | Environment |
|----------|-------|-------------|
| `PANEL_USERNAME` | `carerix` (of wat je wilt) | Production, Preview, Development |
| `PANEL_PASSWORD` | *een sterk wachtwoord* | Production, Preview, Development |

**Na het toevoegen van environment variables:**
- Klik op **"Redeploy"** in Vercel Dashboard → Deployments → (laatste deployment) → ⋯ → Redeploy

---

## Stap 3: Test de Deployment

Je Vercel URL zal er zo uitzien: `https://kvk-panel-carerix.vercel.app`

**Test zonder token** (moet 401 geven):
```
https://kvk-panel-carerix.vercel.app
```

**Test met token** (moet werken):
```
https://kvk-panel-carerix.vercel.app?token=JOUW_ACCESS_TOKEN
```

**Test een KVK lookup:**
```
https://kvk-panel-carerix.vercel.app?token=JOUW_ACCESS_TOKEN
# Zoek op: 69599084
```

---

## Stap 4: Embed in Carerix

### HTML Code voor Carerix

```html
<iframe 
  src="https://kvk-panel-carerix.vercel.app?token=JOUW_ACCESS_TOKEN_HIER"
  width="100%" 
  height="800px"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
</iframe>
```

### Belangrijke punten:

1. **Vervang `JOUW_ACCESS_TOKEN_HIER`** met je daadwerkelijke token uit Vercel
2. **Pas de height aan** naar wat je nodig hebt (800px is een goede start)
3. **De token blijft in de URL** - dit is veilig omdat:
   - Het alleen binnen de iframe zichtbaar is
   - Carerix zelf al geauthenticeerd is
   - De token geen schrijfrechten geeft, alleen lezen van KVK data

### Alternatief: Verberg de token in de URL bar

Als je de token niet in de URL wilt tonen, kun je een proxy pagina maken in Carerix die de iframe laadt met JavaScript:

```html
<div id="kvk-panel-container"></div>
<script>
  const PANEL_URL = 'https://kvk-panel-carerix.vercel.app';
  const ACCESS_TOKEN = 'JOUW_ACCESS_TOKEN_HIER'; // Kan server-side worden ingesteld
  
  const iframe = document.createElement('iframe');
  iframe.src = `${PANEL_URL}?token=${ACCESS_TOKEN}`;
  iframe.width = '100%';
  iframe.height = '800px';
  iframe.frameBorder = '0';
  iframe.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
  
  document.getElementById('kvk-panel-container').appendChild(iframe);
</script>
```

---

## Stap 5: Custom Domain (Optioneel)

Als je een eigen domein wilt gebruiken (bijv. `kvk.jouwbedrijf.nl`):

1. Ga naar Vercel Dashboard → Project → Settings → **Domains**
2. Voeg je domein toe
3. Configureer DNS bij je domain provider:
   - Type: `CNAME`
   - Name: `kvk` (of wat je wilt)
   - Value: `cname.vercel-dns.com`

---

## Troubleshooting

### "Authenticatie vereist" error
- Check of `PANEL_ACCESS_TOKEN` correct is ingesteld in Vercel
- Check of de token in de URL overeenkomt met de env variable
- Redeploy na het toevoegen van env variables

### KVK lookup geeft errors
- Check of `KVK_API_KEY` en `KVK_API_BASE_URL` correct zijn ingesteld
- Test de API direct: `curl https://api.kvk.nl/test/api/v1/basisprofielen/69599084 -H "apikey: l7xx1f2691f2520d487b902f4e0b57a0b197"`

### Iframe wordt niet geladen in Carerix
- Check browser console voor CORS of X-Frame-Options errors
- Vercel staat iframes standaard toe, dus dit zou niet moeten gebeuren
- Als het wel gebeurt, laat het me weten

---

## Volgende Stappen (Stap 2 van het project)

Na succesvolle deployment kun je:
- Carerix GraphQL integratie toevoegen
- "Aanmaken in Carerix" knop implementeren
- KVK data automatisch mappen naar Carerix velden
- OAuth2 voor Carerix API implementeren

Zie de README.md voor meer details over Stap 2.
