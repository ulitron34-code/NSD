# -*- coding: utf-8 -*-
import os

runtime_copy_path = r"F:\CODEX\ulitron34-code-nsd-https-github-com\src\utils\runtimeCopy.js"

missing_translations = {
    # Q&A Tab
    "Quien paga?": "Who pays?",
    "Esto ya funciona?": "Does this work already?",
    "Mercado": "Market",
    
    # Pilot Playbook Tab
    "30 dias": "30 days",
    "10 expedientes": "10 files",
    "SOFOM / fintech / fondo": "SOFOM / fintech / fund",
    "Reporte + renovacion": "Report + renewal",
    "Semana 1": "Week 1",
    "Semana 2": "Week 2",
    "Semana 3": "Week 3",
    "Semana 4": "Week 4",
    "Configurar perfiles, cargar matriz documental, seleccionar 10 expedientes y definir responsables.": "Configure profiles, load document matrix, select 10 files and define responsible parties.",
    "Carga y revision": "Upload and review",
    "Cierre": "Closing",
    "Medir tiempos, faltantes, conversion, friccion, satisfaccion y posibles ingresos.": "Measure times, gaps, conversion, friction, satisfaction and potential revenue.",
    "Revisa data room, solicita informacion, registra interes y retroalimenta criterios.": "Reviews data room, requests information, records interest and provides feedback on criteria.",
    "Metricas, tiempos, hallazgos, fricciones y decisiones.": "Metrics, timeline, findings, friction and decisions.",
    "Duracion": "Duration",
    "Lote inicial": "Initial batch",
    "Entidad objetivo": "Target entity",
    "Resultado": "Result",
    
    # Round Tab
    "Ask sugerido": "Suggested ask",
    "Runway objetivo": "Target runway",
    "Primer mercado": "Initial market",
    "SOFOMES, fintechs, fondos, bancos y solicitantes empresariales.": "SOFOMs, fintechs, funds, banks and business applicants.",
    "USA despues": "USA later",
    "IA / Integraciones": "AI / Integrations",
    "OCR, KYB, biometria, antifraude, proveedores externos y scoring explicable.": "OCR, KYB, biometrics, anti-fraud, external providers and explainable scoring.",
    "Pilotos": "Pilots",
    "Legal / Operacion": "Legal / Operations",
    "0-90 dias": "0-90 days",
    "90-180 dias": "90-180 days",
    "MVP comercial": "Commercial MVP",
    "180-365 dias": "180-365 days",
    "12-18 meses": "12-18 months",
    "Expansion controlada": "Controlled expansion",
    "Demo producto": "Product demo",
    "Listo local": "Ready local",
    "Modelo financiero": "Financial model",
    "Base operativa": "Operating base",
    "Mantener revision humana, explicabilidad, auditoria y disclaimers visibles.": "Maintain human review, explainability, audit trails and visible disclaimers.",
    
    # Governance Tab
    "Requiere texto completo y consentimiento": "Requires full text and consent",
    "IA": "AI",
    "Biometria": "Biometrics",
    "Audit": "Audit",
    "Mapear eventos reales contra Supabase audit_logs": "Map real events against Supabase audit_logs",
    "Durante hardening": "During hardening",
    
    # Traction Tab
    "PILOTOS OBJETIVO": "TARGET PILOTS",
    "Entidades y aliados para validar flujo real.": "Entities and partners to validate real workflow.",
    "CONVERSION META": "TARGET CONVERSION",
    "PRIMER MRR META": "TARGET INITIAL MRR",
    "SOFOM crecimiento": "Growth SOFOM",
    "Alta prioridad": "High priority",
    "Fondo deuda privada": "Private debt fund",
    "Validacion comercial": "Commercial validation",
    "Despacho financiero": "Financial firm",
    "Canal aliado": "Partner channel",
    "Caso demo": "Demo case",
    "Dolor validable": "Validable pain",
    "Monetizacion mixta": "Mixed monetization",
    "Expansion gradual": "Gradual expansion",
    
    # Go/No-Go Tab
    "CHECKS GO": "GO CHECKS",
    "Checks Go": "Go Checks",
    "Precauciones": "Precautions",
    "listos": "ready",
    "PRECAUCIONES": "PRECAUTIONS",
    "no bloqueantes": "non-blocking",
    "DECISION SUGERIDA": "SUGGESTED DECISION",
    "demo controlada": "controlled demo",
    "npm.cmd run build ejecuta sin errores": "npm.cmd run build runs without errors",
    "Carga diferida activa; sin warning mayor a 500 kB": "Lazy loading active; no warnings above 500 kB",
    "Disclaimers visibles pero faltan terminos legales finales": "Visible disclaimers but missing final legal terms",
    "Esperar Published y probar /, /dashboard, /services e /international.": "Wait for Published and test /, /dashboard, /services and /international.",
    
    # Moat Tab
    "Consultorias tradicionales": "Traditional consulting",
    "Data rooms genericos": "Generic data rooms",
    "CRMs financieros": "Financial CRMs",
    "Herramientas KYC/KYB": "KYC/KYB tools",
    "Alto criterio humano": "High human touch",
    "Ordenan archivos": "Organize files",
    "Gestionan pipeline": "Manage pipeline",
    "Verifican identidad": "Verify identity",
    
    # Due Diligence Tab
    "Tesis clara": "Clear thesis",
    "Base defendible": "Defensible base",
    "Backend conectado": "Connected backend",
    "Otorgantes": "Lenders",
    "IA aplicada": "Applied AI",
    "Regulatorio": "Regulatory",
    "Datos sensibles": "Sensitive data",
    "Dependencia IA": "AI dependence",
    "Mantener revision asistida y explicable; evitar decisiones automaticas opacas.": "Maintain assisted and explainable review; avoid opaque automatic decisions.",
    "Adopcion otorgantes": "Funder adoption",
    
    # Roadmap Tab
    "Build local OK y Netlify actualizado": "Local build OK and Netlify updated",
    "Narrativa inversion": "Investment narrative",
    "Terminos, privacidad, IA y biometria": "Terms, privacy, AI and biometrics",
    "3-5 expedientes y 2 otorgantes": "3-5 files and 2 funders"
}

with open(runtime_copy_path, "r", encoding="utf-8") as f:
    content = f.read()

# Locate export const RUNTIME_TRANSLATIONS = {
insert_pos = content.find("export const RUNTIME_TRANSLATIONS = {")
if insert_pos == -1:
    print("Error: export const RUNTIME_TRANSLATIONS not found!")
    exit(1)

brace_pos = content.find("{", insert_pos)
insert_index = brace_pos + 1

# Generate JS code for translations
js_translations = "\n"
for es, en in missing_translations.items():
    # Only add if not already in content
    # Look for "key": or 'key': to be safe
    key_d = f'"{es}"'
    key_s = f"'{es}'"
    if key_d not in content and key_s not in content:
        es_esc = es.replace('"', '\\"')
        en_esc = en.replace('"', '\\"')
        js_translations += f'  "{es_esc}": "{en_esc}",\n'

new_content = content[:insert_index] + js_translations + content[insert_index:]

with open(runtime_copy_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Translations successfully updated!")
