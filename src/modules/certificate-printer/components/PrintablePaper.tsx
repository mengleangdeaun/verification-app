import { createMemo, Show } from 'solid-js';
import type { CertificateRecord, CreateCertificateInput } from '../../../types/certificates';
import type { PaperOrientation, PaperSize, TemplateId } from '../../../types/templates';
import { PAPER_GEOMETRIES, THEMES } from '../constants/themes';
import VectorQrCode from './VectorQrCode';

interface Props {
  data: Partial<CertificateRecord> | Partial<CreateCertificateInput>;
  themeId: TemplateId;
  paperSize: PaperSize;
  orientation: PaperOrientation;
  includeSignatures: boolean;
  isPreview?: boolean;
}

export default function PrintablePaper(props: Props) {
  const geom = createMemo(() => PAPER_GEOMETRIES[props.paperSize]?.[props.orientation] || PAPER_GEOMETRIES.A4.landscape);
  const theme = createMemo(() => THEMES[props.themeId] || THEMES['classic-diploma']);
  const isLandscape = createMemo(() => props.orientation === 'landscape');

  const isTech = () => props.themeId === 'modern-tech';
  const isISO = () => props.themeId === 'iso-compliance';
  const isClassic = () => props.themeId === 'classic-diploma';

  const cert = () => ({
    id: (props.data as any).id || 'CERT-DRAFT-PREVIEW',
    recipient: props.data.recipientName || 'Recipient Full Name',
    program: props.data.programTitle || 'Program / Credential Title',
    desc: props.data.description || 'For demonstrating exceptional mastery and fulfilling all official requirements of the verified curriculum.',
    level: props.data.level || 'Mastery Level',
    issueDate: props.data.issueDate || new Date().toISOString().split('T')[0],
    expiryDate: props.data.expiryDate || null,
    sig1Name: props.data.signatory1Name || 'Dr. Virak Both',
    sig1Title: props.data.signatory1Title || 'Executive Director',
    sig2Name: props.data.signatory2Name || '',
    sig2Title: props.data.signatory2Title || 'Registrar General',
    verifyUrl: (props.data as any).verificationUrl || 'https://verify.example.com',
  });

  return (
    <div
      class={`printable-certificate relative box-border overflow-hidden select-none transition-all duration-300 ${
        props.isPreview
          ? 'mx-auto shadow-xl border border-slate-200/80'
          : 'print-only-container w-full h-full'
      } ${theme().bgClass}`}
      style={{
        width: props.isPreview ? '100%' : `${geom().widthMm}mm`,
        'max-width': props.isPreview ? (isLandscape() ? '820px' : '580px') : undefined,
        height: props.isPreview ? 'auto' : `${geom().heightMm}mm`,
        'min-height': props.isPreview ? (isLandscape() ? '480px' : '640px') : undefined,
        'aspect-ratio': `${geom().widthMm} / ${geom().heightMm}`,
      }}
    >
      {/* Modern Tech Corner Crosshairs */}
      <Show when={isTech()}>
        <div class="absolute top-2 left-2 text-cyan-600/60 font-mono text-xs select-none pointer-events-none">+</div>
        <div class="absolute top-2 right-2 text-cyan-600/60 font-mono text-xs select-none pointer-events-none">+</div>
        <div class="absolute bottom-2 left-2 text-cyan-600/60 font-mono text-xs select-none pointer-events-none">+</div>
        <div class="absolute bottom-2 right-2 text-cyan-600/60 font-mono text-xs select-none pointer-events-none">+</div>
      </Show>

      {/* Certificate Framing */}
      <div class={`h-full w-full flex flex-col justify-between ${theme().borderClass}`}>
        {/* Header */}
        <div class="flex items-center justify-between border-b border-current/15 pb-4">
          <div class="flex items-center">
            <img
              src="/assets/logo.svg"
              alt="Emblem"
              class="h-16 sm:h-20 w-auto object-contain shrink-0 block"
              style={{ height: '64px', width: 'auto' }}
            />
          </div>
          <div class="text-right">
            <span class={`inline-block text-[10px] font-mono px-2.5 py-0.5 rounded border uppercase font-semibold ${
              isTech()
                ? 'border-cyan-500/40 bg-cyan-50/60 text-cyan-800'
                : isISO()
                ? 'border-blue-500/40 bg-blue-50/60 text-blue-800'
                : 'border-amber-600/30 bg-amber-50/60 text-amber-900'
            }`}>
              {cert().level}
            </span>
            <p class="text-[10px] font-mono opacity-60 mt-1 tabular-nums">{cert().id}</p>
          </div>
        </div>

        {/* Central Citation */}
        <div class="my-auto text-center px-6 py-2">
          {/* Program Title centered and above 'This is to certify that' */}
          <h2 class={`text-lg sm:text-xl font-bold tracking-wider uppercase mb-2 text-foreground ${
            isClassic() ? 'font-serif tracking-widest' : isTech() ? 'font-sans font-extrabold tracking-tight' : 'font-sans font-bold tracking-wide'
          }`}>
            {cert().program}
          </h2>

          <p class="text-xs uppercase tracking-widest font-semibold opacity-60 mb-2">This is to certify that</p>
          
          <h1 class={`text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-foreground ${theme().fontFamilyHeading}`}>
            {cert().recipient}
          </h1>

          <Show when={isClassic()}>
            <div class="flex items-center justify-center gap-2 my-2 text-amber-700/40">
              <div class="h-px w-14 bg-amber-700/30"></div>
              <span class="text-xs">✦</span>
              <div class="h-px w-14 bg-amber-700/30"></div>
            </div>
          </Show>

          <p class="text-xs sm:text-sm max-w-xl mx-auto leading-relaxed opacity-75 mb-3 text-foreground">
            {cert().desc}
          </p>

          <div class="flex items-center justify-center gap-6 text-[11px] opacity-75 font-mono">
            <span>Issued: <strong class="tabular-nums font-semibold">{cert().issueDate}</strong></span>
            <span>•</span>
            <span>Valid: <strong class="tabular-nums font-semibold">{cert().expiryDate || 'Lifetime'}</strong></span>
          </div>
        </div>

        {/* Footer: Signatures, Seal & QR */}
        <div class="flex items-end justify-between border-t border-current/15 pt-4 gap-4">
          {/* Signatory 1 */}
          <div class="w-40 text-center">
            <div class="h-14 flex items-end justify-center pb-0.5">
              <img
                src="/assets/sig-1.svg"
                alt="Signature 1"
                class={`h-12 max-w-full object-contain transition-opacity duration-200 ${
                  props.includeSignatures ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
            </div>
            <div class="border-t border-current/50 pt-1">
              <p class="text-xs font-bold truncate text-foreground">{cert().sig1Name}</p>
              <p class="text-[10px] opacity-70 truncate">{cert().sig1Title}</p>
            </div>
          </div>

          {/* Official Seal & QR */}
          <div class="flex items-center gap-4">
            <img src={theme().sealAssetPath} alt="Seal" class="h-14 w-14 object-contain drop-shadow-xs" />
            <div class="text-center">
              <VectorQrCode value={cert().verifyUrl} class="w-14 h-14" />
            </div>
          </div>

          {/* Signatory 2 */}
          <div class="w-40 text-center">
            {cert().sig2Name ? (
              <>
                <div class="h-14 flex items-end justify-center pb-0.5">
                  <img
                    src="/assets/sig-2.svg"
                    alt="Signature 2"
                    class={`h-12 max-w-full object-contain transition-opacity duration-200 ${
                      props.includeSignatures ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />
                </div>
                <div class="border-t border-current/50 pt-1">
                  <p class="text-xs font-bold truncate text-foreground">{cert().sig2Name}</p>
                  <p class="text-[10px] opacity-70 truncate">{cert().sig2Title}</p>
                </div>
              </>
            ) : (
              <div class="h-14 flex items-end justify-center">
                <div class="border-t border-current/30 w-32 pt-1">
                  <p class="text-[10px] opacity-50">Verified Authority</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
