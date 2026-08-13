import { Injectable } from '@angular/core';
import { ConceptCard } from '../models/concept.models';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

@Injectable({
  providedIn: 'root'
})
export class CardSvgExporterService {

  /**
   * Generates a pristine, printable standalone SVG representation of a Concept card.
   */
  generateCardSvg(card: ConceptCard): string {
    const width = 480;
    const height = 660;

    const easyItems = card.easy.map((item, idx) => ({
      num: idx + 1,
      text: item.year ? `${item.text} (${item.year})` : item.text
    }));

    const mediumItems = card.medium.map((item, idx) => ({
      num: idx + 4,
      text: item.year ? `${item.text} (${item.year})` : item.text
    }));

    const hardItems = card.hard.map((item, idx) => ({
      num: idx + 7,
      text: item.year ? `${item.text} (${item.year})` : item.text
    }));

    const renderRows = (items: { num: number; text: string }[], sectionColor: string, numBg: string, numTextColor: string, dashedColor: string, baseY: number) => {
      let rowsSvg = '';
      const rowHeight = 44;

      items.forEach((item, index) => {
        const yPos = baseY + index * rowHeight;
        const textY = yPos + 27;
        const circleY = yPos + 22;

        // Dotted separator if not last row
        const separator = index < items.length - 1
          ? `<line x1="85" y1="${yPos + 44}" x2="420" y2="${yPos + 44}" stroke="${dashedColor}" stroke-width="2.5" stroke-dasharray="3 4"/>`
          : '';

        const fontSize = item.text.length > 28 ? 12.5 : (item.text.length > 20 ? 14 : 16.5);

        rowsSvg += `
          <!-- Row ${item.num} -->
          <g>
            <!-- Number Circle -->
            <circle cx="56" cy="${circleY}" r="14" fill="${numBg}" stroke="${sectionColor}" stroke-width="2"/>
            <text x="56" y="${circleY + 5}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="${numTextColor}" text-anchor="middle">${item.num}</text>

            <!-- Word Text -->
            <text x="252" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="700" fill="#0f172a" text-anchor="middle">${escapeXml(item.text)}</text>
            ${separator}
          </g>
        `;
      });
      return rowsSvg;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <style>
    .card-bg { fill: #ffffff; }
    .inner-guide { stroke: #d2d6dc; stroke-width: 1.5; fill: none; }
    .align-dash { stroke: #e2e8f0; stroke-width: 1.5; stroke-dasharray: 4 4; }
  </style>

  <!-- Outer Card Body -->
  <rect x="15" y="15" width="450" height="630" rx="36" ry="36" class="card-bg" filter="url(#cardShadow)"/>

  <!-- Inner Guide Border -->
  <rect x="30" y="30" width="420" height="600" rx="26" ry="26" class="inner-guide"/>

  <!-- Vertical Dashed Alignment Line -->
  <line x1="56" y1="30" x2="56" y2="630" class="align-dash"/>

  <!-- ========================================================
       🔵 1. SECTION FACILE (1 à 3)
       ======================================================== -->
  <g id="section-easy">
    <!-- Box -->
    <rect x="42" y="48" width="396" height="154" rx="18" ry="18" fill="#ffffff" stroke="#0ea5e9" stroke-width="2.5"/>
    
    <!-- Smiley Badge -->
    <circle cx="410" cy="48" r="16" fill="#ffffff"/>
    <g transform="translate(396, 34)">
      <circle cx="14" cy="14" r="13" fill="#0ea5e9" fill-opacity="0.15" stroke="#0ea5e9" stroke-width="2"/>
      <circle cx="10" cy="11" r="1.5" fill="#0ea5e9"/>
      <circle cx="18" cy="11" r="1.5" fill="#0ea5e9"/>
      <path d="M9 16s2 4 5 4 5-4 5-4" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round"/>
    </g>

    <!-- Rows 1, 2, 3 -->
    ${renderRows(easyItems, '#0ea5e9', '#ffffff', '#0ea5e9', '#7dd3fc', 58)}
  </g>

  <!-- ========================================================
       🔴 2. SECTION MOYEN (4 à 6)
       ======================================================== -->
  <g id="section-medium">
    <!-- Box -->
    <rect x="42" y="232" width="396" height="154" rx="18" ry="18" fill="#ffffff" stroke="#ef4444" stroke-width="2.5"/>
    
    <!-- Smiley Badge -->
    <circle cx="410" cy="232" r="16" fill="#ffffff"/>
    <g transform="translate(396, 218)">
      <circle cx="14" cy="14" r="13" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-width="2"/>
      <circle cx="10" cy="11" r="1.5" fill="#ef4444"/>
      <circle cx="18" cy="11" r="1.5" fill="#ef4444"/>
      <line x1="9" y1="18" x2="19" y2="18" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
    </g>

    <!-- Rows 4, 5, 6 -->
    ${renderRows(mediumItems, '#ef4444', '#ffffff', '#ef4444', '#fca5a5', 242)}
  </g>

  <!-- ========================================================
       🔘 3. SECTION DIFFICILE (7 à 9)
       ======================================================== -->
  <g id="section-hard">
    <!-- Box -->
    <rect x="42" y="416" width="396" height="154" rx="18" ry="18" fill="#f1f5f9" stroke="#475569" stroke-width="2.5"/>
    
    <!-- Smiley Badge -->
    <circle cx="410" cy="416" r="16" fill="#ffffff"/>
    <g transform="translate(396, 402)">
      <circle cx="14" cy="14" r="13" fill="#475569" fill-opacity="0.15" stroke="#475569" stroke-width="2"/>
      <circle cx="10" cy="11" r="1.5" fill="#475569"/>
      <circle cx="18" cy="11" r="1.5" fill="#475569"/>
      <path d="M9 19s2-3 5-3 5 3 5 3" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
    </g>

    <!-- Rows 7, 8, 9 -->
    ${renderRows(hardItems, '#475569', '#ffffff', '#1e293b', '#cbd5e1', 426)}
  </g>

  <!-- Card Watermark / Footer ID -->
  <text x="240" y="612" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="1">CONCEPT • #${card.id}</text>
</svg>`;
  }

  /**
   * Triggers browser download of the SVG file
   */
  downloadCardAsSvg(card: ConceptCard): void {
    const svgString = this.generateCardSvg(card);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `concept-carte-${card.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
