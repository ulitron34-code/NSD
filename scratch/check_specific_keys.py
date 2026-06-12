import re

with open(r"F:\CODEX\ulitron34-code-nsd-https-github-com\src\utils\runtimeCopy.js", "r", encoding="utf-8") as f:
    content = f.read()

keys_to_check = [
    # Q&A
    "Quien paga?",
    "Esto ya funciona?",
    "Mercado",
    "Producto",
    
    # Pilot Playbook
    "30 dias",
    "10 expedientes",
    "SOFOM / fintech / fondo",
    "Reporte + renovacion",
    "Semana 1",
    "Semana 2",
    "Semana 3",
    "Semana 4",
    "Configurar perfiles, cargar matriz documental, seleccionar 10 expedientes y definir responsables.",
    "Carga y revision",
    "Cierre",
    "Medir tiempos, faltantes, conversion, friccion, satisfaccion y posibles ingresos.",
    "Revisa data room, solicita informacion, registra interes y retroalimenta criterios.",
    "Metricas, tiempos, hallazgos, fricciones y decisiones.",
    "Duracion",
    "Lote inicial",
    "Entidad objetivo",
    "Resultado",
    
    # Round
    "Ask sugerido",
    "Runway objetivo",
    "Primer mercado",
    "SOFOMES, fintechs, fondos, bancos y solicitantes empresariales.",
    "Expansion",
    "USA despues",
    "IA / Integraciones",
    "OCR, KYB, biometria, antifraude, proveedores externos y scoring explicable.",
    "Pilotos",
    "Legal / Operacion",
    "0-90 dias",
    "90-180 dias",
    "MVP comercial",
    "180-365 dias",
    "12-18 meses",
    "Expansion controlada",
    "Demo producto",
    "Listo local",
    "Modelo financiero",
    "Base operativa",
    "Mantener revision humana, explicabilidad, auditoria y disclaimers visibles.",
    
    # Governance
    "Requiere texto completo y consentimiento",
    "IA",
    "Biometria",
    "Audit",
    "Mapear eventos reales contra Supabase audit_logs",
    "Durante hardening",
    
    # Traction
    "PILOTOS OBJETIVO",
    "Entidades y aliados para validar flujo real.",
    "CONVERSION META",
    "PRIMER MRR META",
    "SOFOM crecimiento",
    "Alta prioridad",
    "Fondo deuda privada",
    "Validacion comercial",
    "Despacho financiero",
    "Canal aliado",
    "Caso demo",
    "Dolor validable",
    "Monetizacion mixta",
    "Expansion gradual",
    
    # Go/No-Go
    "CHECKS GO",
    "listos",
    "PRECAUCIONES",
    "no bloqueantes",
    "DECISION SUGERIDA",
    "demo controlada",
    "npm.cmd run build ejecuta sin errores",
    "Carga diferida activa; sin warning mayor a 500 kB",
    "Disclaimers visibles pero faltan terminos legales finales",
    "Esperar Published y probar /, /dashboard, /services e /international."
]

print("Checking translations:")
for k in keys_to_check:
    # Match double quoted key
    pattern = r'"' + re.escape(k) + r'"\s*:\s*"([^"]+)"'
    match = re.search(pattern, content)
    if match:
        print(f"FOUND: '{k}' -> '{match.group(1)}'")
    else:
        # Match single quoted key
        pattern_s = r"'" + re.escape(k) + r"'\s*:\s*'([^']+)'"
        match_s = re.search(pattern_s, content)
        if match_s:
            print(f"FOUND: '{k}' -> '{match_s.group(1)}'")
        else:
            print(f"MISSING: '{k}'")
