import type { PaperOrientation, PaperSize } from '../../../types/templates';

export function triggerCertificatePrint(size: PaperSize, orientation: PaperOrientation): void {
  if (typeof window === 'undefined') return;

  const styleId = 'dynamic-print-page-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const paperSizeRule = size === 'A4' ? 'A4' : 'letter';
  styleEl.textContent = `
    @page {
      size: ${paperSizeRule} ${orientation};
      margin: 0mm !important;
    }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .print-only-container {
        display: block !important;
        width: 100vw !important;
        height: 100vh !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  `;

  // Brief timeout to allow styles to apply before triggering browser print dialog
  setTimeout(() => {
    window.print();
  }, 50);
}
