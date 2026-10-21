import type { PaperOrientation, PaperSize, PrintGeometry, TemplateId, TemplateThemeConfig } from '../../../types/templates';

export const PAPER_GEOMETRIES: Record<PaperSize, Record<PaperOrientation, PrintGeometry>> = {
  A4: {
    landscape: { size: 'A4', orientation: 'landscape', widthMm: 297, heightMm: 210, cssPageRule: 'size: 297mm 210mm; margin: 0mm !important;' },
    portrait: { size: 'A4', orientation: 'portrait', widthMm: 210, heightMm: 297, cssPageRule: 'size: 210mm 297mm; margin: 0mm !important;' },
  },
  LETTER: {
    landscape: { size: 'LETTER', orientation: 'landscape', widthMm: 279.4, heightMm: 215.9, cssPageRule: 'size: 279.4mm 215.9mm; margin: 0mm !important;' },
    portrait: { size: 'LETTER', orientation: 'portrait', widthMm: 215.9, heightMm: 279.4, cssPageRule: 'size: 215.9mm 279.4mm; margin: 0mm !important;' },
  },
};

const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) ? import.meta.env.BASE_URL : '/';
const defaultSealAsset = `${baseUrl.replace(/\/$/, '')}/assets/seal.svg`;

export const THEMES: Record<TemplateId, TemplateThemeConfig> = {
  'classic-diploma': {
    id: 'classic-diploma',
    label: 'Classic Diploma',
    defaultOrientation: 'landscape',
    borderClass: 'border-4 sm:border-8 border-double border-amber-700/60 p-2.5 sm:p-6 md:p-8 ring-1 ring-amber-600/20 shadow-inner',
    bgClass: 'bg-[#fdfcf7] text-slate-900',
    accentColorHex: '#b45309',
    fontFamilyHeading: 'font-serif',
    sealAssetPath: defaultSealAsset,
  },
  'modern-tech': {
    id: 'modern-tech',
    label: 'Modern Tech Certificate',
    defaultOrientation: 'landscape',
    borderClass: 'border-2 border-slate-900 p-2.5 sm:p-6 md:p-8 ring-1 ring-cyan-500/40 shadow-sm',
    bgClass: 'bg-white text-slate-900',
    accentColorHex: '#0891b2',
    fontFamilyHeading: 'font-sans',
    sealAssetPath: defaultSealAsset,
  },
  'iso-compliance': {
    id: 'iso-compliance',
    label: 'ISO Compliance Credential',
    defaultOrientation: 'portrait',
    borderClass: 'border-2 border-slate-300 p-2.5 sm:p-6 md:p-8 ring-1 ring-blue-700/30 shadow-xs',
    bgClass: 'bg-white text-slate-900',
    accentColorHex: '#1d4ed8',
    fontFamilyHeading: 'font-sans',
    sealAssetPath: defaultSealAsset,
  },
};
