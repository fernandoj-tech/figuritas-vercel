# Mi Álbum · Figuritas (Vercel)

PWA instalable + escaneo de figus por IA, en **Vercel** (serverless). `/api/scan` queda **abierto** (sin PIN ni tope). La API key vive en una env var del proyecto.

## Estructura
```
figuritas-vercel/
├── api/scan.js               # Serverless Function: POST /api/scan
├── public/
│   ├── index.html            # la app (libs embebidas, offline)
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── icon-192.png / icon-512.png
├── vercel.json               # maxDuration de la function
└── package.json
```

## Publicar (2 formas)

**A) CLI (rápido):**
```bash
npm i -g vercel
cd figuritas-vercel
vercel                      # primer deploy (preview)
vercel env add ANTHROPIC_API_KEY     # pegás tu key (Production)
vercel --prod               # deploy productivo
```

**B) Git + Dashboard:**
1. Subí esta carpeta a un repo (GitHub/GitLab).
2. En vercel.com → **Add New → Project** → importás el repo.
3. **Framework Preset: Other** (no toques build/output, es estático + /api).
4. **Settings → Environment Variables** → `ANTHROPIC_API_KEY` = tu key → Save.
5. **Deploy**. Listo: la app queda en `https://tu-proyecto.vercel.app`.

> Si ya estaba deployado cuando cargaste la key, hacé **Redeploy** para que la tome.

## Probar
- Abrí la URL → marcás a mano, generás el **QR** e importás → todo client-side.
- **📷 Escanear figus** → la foto va a `/api/scan` → la IA lee los códigos.
- En el celu: **"Agregar a pantalla de inicio"** para instalarla.

## Notas
- `/api/scan` está **abierto**: cualquiera con la URL puede gastar tu cuota de API. Si después querés cerrarlo, te agrego un PIN (cookie firmada) o protección por Origin.
- Límite de body en Vercel Hobby ≈ 4.5 MB; las fotos van comprimidas (~300 KB), sobra.
- El tope diario quedó **afuera** (en serverless necesitaría Vercel KV / Upstash para persistir).
