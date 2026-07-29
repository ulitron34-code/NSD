from __future__ import annotations

import html
import re
import shutil
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, KeepTogether, ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / 'docs' / 'nuxera-migration' / 'docs' / 'migration'
OUT_ROOT = SOURCE_DIR / 'deliverables' / '2026-07-29'
SPANISH = [
    'NUXERA_MANUAL_FUNCIONAL_DETALLADO_2026-07-29_ES.md',
    'NUXERA_MANUAL_TECNICO_DETALLADO_2026-07-29_ES.md',
    'NUXERA_PRUEBAS_Y_EVIDENCIA_VISUAL_2026-07-29_ES.md',
    'NUXERA_LO_QUE_FALTA_REALMENTE_2026-07-29_ES.md',
]
ENGLISH = [
    'NUXERA_DETAILED_FUNCTIONAL_MANUAL_2026-07-29_EN.md',
    'NUXERA_DETAILED_TECHNICAL_MANUAL_2026-07-29_EN.md',
    'NUXERA_TESTING_AND_VISUAL_EVIDENCE_2026-07-29_EN.md',
    'NUXERA_REAL_REMAINING_WORK_2026-07-29_EN.md',
]

styles = getSampleStyleSheet()
styles.add(ParagraphStyle('NuxTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=22, leading=26, textColor=colors.HexColor('#0B2545'), alignment=TA_LEFT, spaceAfter=8))
styles.add(ParagraphStyle('NuxSubtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=10.5, leading=14, textColor=colors.HexColor('#555555'), spaceAfter=8))
styles.add(ParagraphStyle('NuxBody', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.8, leading=13.4, textColor=colors.HexColor('#111111'), spaceAfter=6))
styles.add(ParagraphStyle('NuxH1', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=15, leading=18, textColor=colors.HexColor('#1F4D78'), spaceBefore=12, spaceAfter=6))
styles.add(ParagraphStyle('NuxH3', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=11.5, leading=14, textColor=colors.HexColor('#2E74B5'), spaceBefore=8, spaceAfter=4))
styles.add(ParagraphStyle('NuxList', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5, leading=12.8, leftIndent=4, spaceAfter=3))
styles.add(ParagraphStyle('NuxCaption', parent=styles['BodyText'], fontName='Helvetica-Oblique', fontSize=8.2, leading=10, textColor=colors.HexColor('#555555'), alignment=TA_CENTER, spaceAfter=6))


def marked(text: str) -> str:
    text = html.escape(text)
    text = re.sub(r'`([^`]+)`', r'<font name="Courier">\1</font>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    return text


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#666666'))
    canvas.drawString(0.8 * inch, 0.45 * inch, 'NUXERA Financial Intelligence')
    canvas.drawRightString(7.7 * inch, 0.45 * inch, f'Page {doc.page}')
    canvas.restoreState()


def image_blocks(src: str, alt: str):
    image_path = (SOURCE_DIR / src).resolve()
    if not image_path.exists():
        return []
    with PILImage.open(image_path) as img:
        width, height = img.size
    max_width = 6.5 * inch
    max_height = 5.15 * inch
    scale = min(max_width / width, max_height / height)
    return [KeepTogether([Image(str(image_path), width=width * scale, height=height * scale), Spacer(1, 0.06 * inch), Paragraph(marked(alt), styles['NuxCaption'])]), Spacer(1, 0.12 * inch)]


def build_pdf(md_path: Path, pdf_path: Path, language_label: str):
    raw = md_path.read_text(encoding='utf-8').splitlines()
    title = next((line[2:].strip() for line in raw if line.startswith('# ')), md_path.stem)
    subtitle = 'Documento generado desde la evidencia NUXERA' if language_label == 'Espanol' else 'Document generated from NUXERA evidence'
    story = [Paragraph(marked(title), styles['NuxTitle']), Paragraph(marked(subtitle), styles['NuxSubtitle']), Spacer(1, 0.12 * inch)]
    story.append(Table([
        ['Fecha', '2026-07-29'],
        ['Paquete', language_label],
        ['Producto', 'NUXERA Financial Intelligence'],
        ['Uso', 'Revision interna, socio, inversionistas y decision de cutover'],
    ], colWidths=[1.35 * inch, 5.15 * inch], style=TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E8EEF5')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0B2545')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.8),
        ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#DADCE0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ])))
    story.append(Spacer(1, 0.18 * inch))
    pending = []

    def flush():
        nonlocal pending
        if pending:
            story.append(Paragraph(marked(' '.join(pending).strip()), styles['NuxBody']))
            pending = []

    for line in raw:
        stripped = line.strip()
        if not stripped:
            flush()
            continue
        if stripped.startswith('# '):
            continue
        if stripped.startswith('!['):
            flush()
            match = re.match(r'!\[(.*?)\]\((.*?)\)', stripped)
            if match:
                story.extend(image_blocks(match.group(2), match.group(1)))
            continue
        if stripped.startswith('### '):
            flush()
            story.append(Paragraph(marked(stripped[4:].strip()), styles['NuxH3']))
            continue
        if stripped.startswith('## '):
            flush()
            story.append(Paragraph(marked(stripped[3:].strip()), styles['NuxH1']))
            continue
        if stripped.startswith('- '):
            flush()
            story.append(ListFlowable([ListItem(Paragraph(marked(stripped[2:].strip()), styles['NuxList']))], bulletType='bullet', leftIndent=18, bulletFontSize=7))
            continue
        if re.match(r'^\d+\.\s+', stripped):
            flush()
            item_text = re.sub(r'^\d+\.\s+', '', stripped)
            story.append(ListFlowable([ListItem(Paragraph(marked(item_text), styles['NuxList']))], bulletType='1', leftIndent=18))
            continue
        pending.append(stripped.rstrip('  '))
    flush()
    doc = SimpleDocTemplate(str(pdf_path), pagesize=letter, rightMargin=0.8 * inch, leftMargin=0.8 * inch, topMargin=0.75 * inch, bottomMargin=0.75 * inch, title=title, author='NUXERA Financial Intelligence')
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


def build_package(package_name: str, sources: list[str], language_label: str):
    package_dir = OUT_ROOT / package_name
    package_dir.mkdir(parents=True, exist_ok=True)
    for source in sources:
        build_pdf(SOURCE_DIR / source, package_dir / source.replace('.md', '.pdf'), language_label)
    return package_dir


if __name__ == '__main__':
    print(build_package('NUXERA_Paquete_Espanol_2026-07-29', SPANISH, 'Espanol'))
    print(build_package('NUXERA_English_Package_2026-07-29', ENGLISH, 'English'))
