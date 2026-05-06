from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "CineSaga_Synopsis.md"
OUTPUT = ROOT / "CineSaga_Project_Synopsis.pdf"


def escape_inline(text: str) -> str:
    text = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`(.+?)`", r"<font name='Courier'>\1</font>", text)
    return text


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=30,
            textColor=colors.HexColor("#1F2A44"),
            alignment=TA_CENTER,
            spaceAfter=18,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=18,
            textColor=colors.HexColor("#45556E"),
            alignment=TA_CENTER,
            spaceAfter=10,
        ),
        "h1": ParagraphStyle(
            "Heading1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=22,
            textColor=colors.HexColor("#1F2A44"),
            spaceBefore=16,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "Heading2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#2F5D62"),
            spaceBefore=13,
            spaceAfter=7,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.4,
            leading=15.4,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#20242A"),
            spaceAfter=7,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.2,
            leading=14.8,
            leftIndent=18,
            firstLineIndent=-10,
            textColor=colors.HexColor("#20242A"),
            spaceAfter=5,
        ),
        "table_cell": ParagraphStyle(
            "TableCell",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=11.4,
            textColor=colors.HexColor("#20242A"),
        ),
        "table_header": ParagraphStyle(
            "TableHeader",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.8,
            leading=11.4,
            textColor=colors.white,
        ),
    }


def parse_markdown(md_text: str, styles):
    story = []
    lines = md_text.splitlines()
    paragraph_buffer: list[str] = []
    title_seen = False

    def flush_paragraph():
        nonlocal paragraph_buffer
        if paragraph_buffer:
            text = " ".join(line.strip() for line in paragraph_buffer).strip()
            if text:
                story.append(Paragraph(escape_inline(text), styles["body"]))
            paragraph_buffer = []

    def add_table(start: int) -> int:
        rows = []
        i = start
        while i < len(lines) and lines[i].strip().startswith("|"):
            raw = lines[i].strip().strip("|")
            cells = [cell.strip() for cell in raw.split("|")]
            if not all(re.fullmatch(r":?-{3,}:?", c or "") for c in cells):
                rows.append(cells)
            i += 1

        if rows:
            formatted = []
            for row_index, row in enumerate(rows):
                style = styles["table_header"] if row_index == 0 else styles["table_cell"]
                formatted.append([Paragraph(escape_inline(cell), style) for cell in row])

            table = Table(formatted, colWidths=[1.35 * inch, 2.35 * inch, 2.15 * inch])
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F5D62")),
                        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D3DAE6")),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 7),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F9FC")]),
                    ]
                )
            )
            story.append(table)
            story.append(Spacer(1, 8))
        return i

    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()

        if not stripped:
            flush_paragraph()
            i += 1
            continue

        if stripped.startswith("|"):
            flush_paragraph()
            i = add_table(i)
            continue

        heading = re.match(r"^(#{1,3})\s+(.+)$", stripped)
        if heading:
            flush_paragraph()
            level = len(heading.group(1))
            text = escape_inline(heading.group(2))
            if level == 1 and not title_seen:
                story.append(Paragraph(text, styles["title"]))
                story.append(Paragraph("Project Synopsis", styles["subtitle"]))
                story.append(Spacer(1, 0.45 * inch))
                title_seen = True
            elif level == 1:
                story.append(PageBreak())
                story.append(Paragraph(text, styles["h1"]))
            else:
                story.append(Paragraph(text, styles["h2"]))
            i += 1
            continue

        bullet = re.match(r"^[-*]\s+(.+)$", stripped)
        numbered = re.match(r"^\d+\.\s+(.+)$", stripped)
        if bullet or numbered:
            flush_paragraph()
            item = bullet.group(1) if bullet else numbered.group(1)
            marker = "•" if bullet else f"{stripped.split('.', 1)[0]}."
            story.append(Paragraph(f"{marker} {escape_inline(item)}", styles["bullet"]))
            i += 1
            continue

        paragraph_buffer.append(stripped)
        i += 1

    flush_paragraph()
    return story


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawCentredString(A4[0] / 2, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def main():
    styles = build_styles()
    md_text = INPUT.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.72 * inch,
        title="CineSaga Project Synopsis",
        author="CineSaga Project",
    )
    story = parse_markdown(md_text, styles)
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(OUTPUT)


if __name__ == "__main__":
    main()
