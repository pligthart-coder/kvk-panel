# Quick Deploy Guide - Follow These Steps

## Step 1: Deploy via Vercel Website (5 minutes)

### A. Create GitHub Repository (Optional but Recommended)

1. Go to https://github.com/new
2. Repository name: `kvk-panel-carerix`
3. Make it **Private**
4. Click "Create repository"

5. Push your code:
```bash
cd /Users/Patrick/Downloads/kvk-panel-step1
git remote add origin https://github.com/YOUR_USERNAME/kvk-panel-carerix.git
git branch -M main
git push -u origin main
```

### B. Deploy to Vercel

1. **Go to https://vercel.com/signup** (or login if you have an account)
   - Sign up with GitHub (easiest)

2. **Click "Add New..." → "Project"**

3. **Import your repository:**
   - If you created GitHub repo: Select `kvk-panel-carerix` from the list
   - If you skipped GitHub: Click "Browse" and select the folder `/Users/Patrick/Downloads/kvk-panel-step1`

4. **Configure Project:**
   - Project Name: `kvk-panel-carerix` (or anything you like)
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

5. **DON'T click Deploy yet!** First add environment variables:

---

## Step 2: Add Environment Variables

**In the same deployment screen, scroll down to "Environment Variables"**

Add these 3 variables (click "Add" after each):

### Variable 1: KVK_API_KEY
```
Name:  KVK_API_KEY
Value: l7xx1f2691f2520d487b902f4e0b57a0b197
```
☑️ Production ☑️ Preview ☑️ Development

### Variable 2: KVK_API_BASE_URL
```
Name:  KVK_API_BASE_URL
Value: https://api.kvk.nl/test/api/v1
```
☑️ Production ☑️ Preview ☑️ Development

### Variable 3: PANEL_ACCESS_TOKEN

**First, generate a secure token:**

Open Terminal and run:
```bash
openssl rand -hex 32
```

Copy the output (it will look like: `a7f8d9e2c1b4a5f6e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0`)

Then add:
```
Name:  PANEL_ACCESS_TOKEN
Value: [paste the token you just generated]
```
☑️ Production ☑️ Preview ☑️ Development

**⚠️ SAVE THIS TOKEN!** You'll need it for the iframe URL.

---

## Step 3: Deploy!

1. Click **"Deploy"** button
2. Wait 2-3 minutes for the build to complete
3. You'll see a success screen with your URL

Your panel will be at: `https://kvk-panel-carerix.vercel.app` (or similar)

---

## Step 4: Test Your Deployment

### Test 1: Without token (should show "Authenticatie vereist")
```
https://kvk-panel-carerix.vercel.app
```

### Test 2: With token (should work!)
```
https://kvk-panel-carerix.vercel.app?token=YOUR_TOKEN_HERE
```
Replace `YOUR_TOKEN_HERE` with the token you generated in Step 2.

### Test 3: Search for a company
Once the panel loads, try searching for: `69599084`

You should see: **Test EMZ Dagobert**

---

## Step 5: Embed in Carerix

Use this HTML code in Carerix:

```html
<iframe 
  src="https://kvk-panel-carerix.vercel.app?token=YOUR_TOKEN_HERE"
  width="100%" 
  height="800px"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;">
</iframe>
```

**Replace:**
- `kvk-panel-carerix.vercel.app` with your actual Vercel URL
- `YOUR_TOKEN_HERE` with your actual token

---

## Troubleshooting

### "Authenticatie vereist" error even with token
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check if `PANEL_ACCESS_TOKEN` is set correctly
3. Make sure the token in the URL matches exactly
4. Click "Redeploy" in Deployments tab

### Build failed
1. Check the build logs in Vercel
2. Most common issue: missing dependencies
3. Try redeploying

### KVK API errors
1. Check if `KVK_API_KEY` is set to: `l7xx1f2691f2520d487b902f4e0b57a0b197`
2. Check if `KVK_API_BASE_URL` is set to: `https://api.kvk.nl/test/api/v1`
3. Redeploy after fixing

---

## Your Deployment Checklist

- [ ] Created Vercel account
- [ ] Imported project to Vercel
- [ ] Added KVK_API_KEY environment variable
- [ ] Added KVK_API_BASE_URL environment variable
- [ ] Generated and added PANEL_ACCESS_TOKEN
- [ ] Clicked Deploy
- [ ] Tested URL without token (should fail)
- [ ] Tested URL with token (should work)
- [ ] Searched for KVK number 69599084
- [ ] Created iframe code for Carerix
- [ ] Saved token somewhere safe

---

## Need Help?

If you get stuck, share:
1. Your Vercel deployment URL
2. Any error messages from the build logs
3. What step you're on

Good luck! 🚀
