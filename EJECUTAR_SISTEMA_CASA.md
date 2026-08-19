# 🚀 EJECUTAR SISTEMA EN CASA - NUXERA Identity Verification

**Fecha:** 2026-08-18  
**Status:** ✅ LISTO PARA EJECUTAR  

---

## ⚡ OPCIÓN 1: Ejecutar TODO en Una Línea (Windows PowerShell)

Abre **PowerShell** y copia esto:

```powershell
cd "C:\Users\usalgado\Documents\Codex\2026-08-17\te-paso-los-links-de-github\NSD"; Start-Process powershell -ArgumentList "-NoExit -Command 'cd backend; npm run dev'" -WindowStyle Normal; Start-Sleep -Seconds 3; npm run dev
```

---

## ⚡ OPCIÓN 2: Dos Terminales Separadas (RECOMENDADO)

### Terminal 1 - Backend

```powershell
cd "C:\Users\usalgado\Documents\Codex\2026-08-17\te-paso-los-links-de-github\NSD\backend"
npm run dev
```

Espera que diga:
```
🚀 Server running on http://localhost:3001
```

---

### Terminal 2 - Frontend (ABRE NUEVA TERMINAL)

```powershell
cd "C:\Users\usalgado\Documents\Codex\2026-08-17\te-paso-los-links-de-github\NSD"
npm run dev
```

Espera que diga:
```
➜  Local:   http://localhost:5173/
```

---

## 🎯 Una Vez que Ambos Estén Corriendo

1. **Abre navegador:** `http://localhost:5173/`
2. **Navega a:** Dashboard → Otorgantes (o tu URL)
3. **Busca pestaña:** "🔍 Verificar Identidad"
4. **Escribe:** `OFAC`
5. **Click:** "Verificar"
6. **Deberías ver:** ⚠️ MEDIUM RISK + "1 coincidencia encontrada"

**¡Si ves esto = SISTEMA 100% FUNCIONAL! ✅**

---

## 📝 Si Algo Falla

### "npm: command not found"
```powershell
node --version
npm --version
```
Si da error, instala Node.js: https://nodejs.org/

### "Cannot connect to localhost:3001"
- Verifica que Terminal 1 dice "Server running on..."
- Espera 5 segundos antes de abrir el navegador

### "Cannot GET /"
- Frontend no está corriendo
- Ejecuta Terminal 2 con `npm run dev`

### "API Error" en búsqueda
- Mira logs en Terminal 1 (backend)
- Verifica `.env` tiene GEMINI_API_KEY
- Verifica conexión a Supabase

---

## 🔑 Archivo .env (Para Referencia)

Debe tener esto (ver archivo `backend/.env` para valores actuales):
```
SUPABASE_URL=<tu-supabase-url>
SUPABASE_KEY=<tu-supabase-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
OPENAI_API_KEY=<tu-openai-key>
GEMINI_API_KEY=<tu-gemini-key>
```

Si falta algo, ve a: `backend/.env`

---

## ✅ Checklist Rápido

- [ ] PowerShell o Terminal abierta
- [ ] Terminal 1: `npm run dev` (backend) → "Server running on..."
- [ ] Terminal 2: `npm run dev` (frontend) → "http://localhost:5173"
- [ ] Navegador: http://localhost:5173/
- [ ] Pestaña: "🔍 Verificar Identidad" visible
- [ ] Búsqueda: "OFAC" → Resultado ⚠️ MEDIUM
- [ ] ✅ SISTEMA FUNCIONAL

---

**¡Listo para ejecutar!** 🎉

Cualquier duda, revisar: `FALTANTE_IDENTIDAD.md`
