import type { PaperOrientation, PaperSize } from '../../../types/templates';
import { PAPER_GEOMETRIES } from '../constants/themes';

export function triggerCertificatePrint(size: PaperSize, orientation: PaperOrientation): void {
  if (typeof window === 'undefined') return;

  const styleId = 'dynamic-print-page-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const geom = PAPER_GEOMETRIES[size || 'A4']?.[orientation || 'landscape'] || PAPER_GEOMETRIES.A4.landscape;
  const paperSizeRule = size === 'A4' ? 'A4' : 'letter';

  styleEl.textContent = `
    @page {
      size: ${paperSizeRule} ${orientation};
      margin: 0mm !important;
    }
    @media print {
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
      }
      html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: hidden !important;
      }
      .no-print {
        display: none !important;
      }
      .print-only-container {
        display: block !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: ${geom.widthMm}mm !important;
        height: ${geom.heightMm}mm !important;
        max-width: ${geom.widthMm}mm !important;
        max-height: ${geom.heightMm}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `;

  // Brief timeout to allow styles to apply before triggering browser print dialog
  setTimeout(() => {
    window.print();
  }, 50);
}
