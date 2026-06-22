# DEPLOY-COWORK.md — Instrucciones para publicar en Vercel

> Este archivo es para el agente (Cowork / Claude Code). Seguí estos pasos tal cual.
> Fernando: pegale a Cowork el prompt que está al final del archivo.

## Qué es este proyecto

App PWA "Mi Álbum" para trackear el álbum Panini **Usa Méx Can 26**.
Es un **front estático** (`public/index.html`, ya autocontenido) + **una sola función serverless**:

- `api/scan.js` → endpoint `POST /api/scan`. Recibe una foto en base64, llama a la API de
  Anthropic (modelo `claude-sonnet-4-6`) con visión y devuelve `[{code,num}]` de las figuritas
  detectadas. Lee la API key desde `process.env.ANTHROPIC_API_KEY`.

Todo lo demás (escaneo de QR, intercambios, edición manual, export/import) corre 100% en el
browser. El único motivo por el que hace falta backend es el escaneo con IA de la cámara.

## Estructura

```
figuritas-vercel/
├─ api/scan.js          # serverless function (CommonJS module.exports)
├─ public/              # front estático (index.html + manifest + sw + iconos)
├─ vercel.json          # config: maxDuration 30s para api/scan
├─ package.json
└─ .env.example         # plantilla; el valor real va como env var en Vercel, NO en el código
```

## Objetivo

Publicar en Vercel y dejar `https://<proyecto>.vercel.app` funcionando, con el escaneo
de cámara operativo (es decir, con la env var `ANTHROPIC_API_KEY` seteada en el proyecto).

## Pasos para el agente

1. **Prerrequisitos**
   - Verificá Node 18+ (`node -v`).
   - Instalá la CLI de Vercel si falta: `npm i -g vercel` (verificá con `vercel --version`).

2. **Login en Vercel** (lo hace Fernando)
   - Corré `vercel login` y avisale a Fernando que confirme en el navegador / mail.
   - Si Fernando prefiere, puede usar un token: él lo genera en vercel.com → Settings → Tokens
     y lo exporta con `export VERCEL_TOKEN=...` (no lo escribas vos, que lo pegue él).

3. **Primer deploy (preview)**
   - Parado en la raíz de esta carpeta, corré `vercel`.
   - Cuando pregunte:
     - *Set up and deploy?* → **yes**
     - *Which scope?* → la cuenta de Fernando
     - *Link to existing project?* → **no** (proyecto nuevo)
     - *Project name?* → ej. `figuritas` (o lo que elija Fernando)
     - *In which directory is your code located?* → **`./`**
     - *Framework Preset?* → **Other**
     - El resto, defaults.

4. **Setear la env var `ANTHROPIC_API_KEY`** (CRÍTICO — sin esto el escaneo IA tira error 500)
   - `vercel env add ANTHROPIC_API_KEY`
   - Cuando pida el valor → **que lo pegue Fernando** (es su API key de console.anthropic.com).
     ⚠️ NUNCA hardcodear la key en el código ni commitearla. Va SOLO como env var en Vercel.
   - Aplicala a los 3 entornos cuando pregunte: **Production, Preview, Development**.

5. **Deploy a producción**
   - `vercel --prod`
   - Anotá la URL final `https://<proyecto>.vercel.app`.

6. **Verificación**
   - Abrí la URL: debe cargar el álbum con las 994 figuritas.
   - Probá `GET /api/scan` → debe responder **405** (solo acepta POST). OK = la función está viva.
   - Para el escaneo real, Fernando abre la app en el celu (HTTPS ✓), entra a **📷 Escanear**
     y saca una foto: debería devolver las figus detectadas. Si tira 500 → revisar que la env
     var quedó seteada en **Production** y volver a `vercel --prod`.

## Notas

- `vercel.json` ya define `maxDuration: 30` para `api/scan.js` (las llamadas a visión pueden
  tardar). No hace falta tocarlo.
- El endpoint `/api/scan` está **abierto** (sin PIN ni límite diario), por decisión de Fernando.
  Si más adelante quiere protegerlo o ponerle un tope de uso/costo, avisar — hay una versión
  VPS con PIN + límite diario lista para adaptar.
- **Git (opcional, recomendado):** si Fernando quiere CI automático, conectá el repo a Vercel
  (push → deploy). Inicializá git, creá repo en GitHub y linkealo desde el dashboard de Vercel.
  Asegurate de que `.env` esté en `.gitignore` (la key nunca va al repo).

---

## PROMPT PARA PEGARLE A COWORK / DISPATCH

```
Conectá esta carpeta y publicá el proyecto en Vercel siguiendo DEPLOY-COWORK.md.
Es un front estático + una función serverless (api/scan.js).
Pará y pedime confirmación cuando haya que: (1) hacer login en Vercel y
(2) pegar el valor de ANTHROPIC_API_KEY. No hardcodees la key en ningún lado.
Al terminar, pasame la URL de producción y confirmá que GET /api/scan devuelve 405.
```
