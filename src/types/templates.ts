export type TemplateId = 'classic-diploma' | 'modern-tech' | 'iso-compliance';
export type PaperSize = 'A4' | 'LETTER';
export type PaperOrientation = 'landscape' | 'portrait';

export interface PrintGeometry {
  size: PaperSize;
  orientation: PaperOrientation;
  widthMm: number;
  heightMm: number;
  cssPageRule: string;
}

export interface TemplateThemeConfig {
  id: TemplateId;
  label: string;
  defaultOrientation: PaperOrientation;
  borderClass: string;
  bgClass: string;
  accentColorHex: string;
  fontFamilyHeading: string;
  sealAssetPath: string;
}
