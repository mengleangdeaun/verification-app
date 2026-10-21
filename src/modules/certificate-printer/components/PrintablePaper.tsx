import { createMemo } from 'solid-js';
import type { CertificateRecord, CreateCertificateInput } from '../../../types/certificates';
import type { PaperOrientation, PaperSize, TemplateId } from '../../../types/templates';
import { PAPER_GEOMETRIES, THEMES } from '../constants/themes';
import VectorQrCode from './VectorQrCode';
import { assetUrl } from '../../../utils/paths';

interface Props {
  data: Partial<CertificateRecord> | Partial<CreateCertificateInput>;
  themeId: TemplateId;
  paperSize: PaperSize;
  orientation: PaperOrientation;
  isPreview?: boolean;
}

import { formatDisplayDate, cleanDescription } from '../utils/formatUtils';

export default function PrintablePaper(props: Props) {
  const geom = createMemo(() => PAPER_GEOMETRIES[props.paperSize]?.[props.orientation] || PAPER_GEOMETRIES.A4.landscape);
  const theme = createMemo(() => THEMES[props.themeId] || THEMES['classic-diploma']);
  const isLandscape = createMemo(() => props.orientation === 'landscape');

  const isClassic = () => props.themeId === 'classic-diploma';

  const docType = () => (props.data as any).docType || 'COMPLETION';
  const isQualification = () => docType() === 'QUALIFICATION';
  const isAppreciation = () => docType() === 'APPRECIATION';
  const isPromotion = () => docType() === 'PROMOTION';

  const mastheadTitle = () => {
    if (isQualification()) return 'Certificate of Qualification';
    if (isAppreciation()) return 'Letter of Appreciation';
    if (isPromotion()) return 'Letter of Promotion';
    return 'Certificate of Completion';
  };

  const leadPhrase = () => {
    if (isAppreciation()) return 'This letter is proudly presented to';
    if (isPromotion()) return 'This officially certifies that';
    if (isQualification()) return 'This is to certify that';
    return 'This is to verify that';
  };

  const fullCitation = () => {
    let text = cert().desc;
    // If an expiry date is specified on the credential and not already written into the citation:
    if (cert().expiryDate && !/valid\s+(?:until|through)/i.test(text)) {
      const formattedExpiry = formatDisplayDate(cert().expiryDate);
      if (formattedExpiry) {
        text = text.replace(/[\.\s]+$/, '');
        text = `${text}, valid until ${formattedExpiry}.`;
      }
    }
    return text;
  };

  const cert = () => ({
    id: (props.data as any).id || 'CERT-DRAFT-PREVIEW',
    docType: docType(),
    recipient: props.data.recipientName || 'Recipient Full Name',
    program: props.data.programTitle || (isPromotion() ? 'Promoted Role / Title' : isQualification() ? 'Certified Qualification' : isAppreciation() ? 'Recognition Occasion' : 'Program / Credential Title'),
    desc: cleanDescription(props.data.description || 'For demonstrating exceptional mastery and fulfilling all official requirements of the verified curriculum.', props.data.recipientName || ''),
    level: props.data.level || 'Standard',
    issueDate: props.data.issueDate || new Date().toISOString().split('T')[0],
    expiryDate: props.data.expiryDate || null,
    sig1Name: props.data.signatory1Name || 'Sok Sabay',
    sig1Title: props.data.signatory1Title || 'Technical Supervisor',
    sig2Name: props.data.signatory2Name || '',
    sig2Title: props.data.signatory2Title || 'Managing Director',
    verifyUrl: (props.data as any).verificationUrl || 'https://verify.example.com',
  });

  return (
    <div
      class={`printable-certificate ${isLandscape() ? 'orientation-landscape' : 'orientation-portrait'} relative box-border select-none transition-all duration-300 ${
        props.isPreview
          ? 'mx-auto shadow-lg sm:shadow-xl border border-slate-200/80 rounded-sm'
          : 'print-only-container w-full h-full overflow-hidden'
      } ${theme().bgClass}`}
      style={{
        width: props.isPreview ? '100%' : `${geom().widthMm}mm`,
        'max-width': props.isPreview ? (isLandscape() ? '820px' : '580px') : undefined,
        height: props.isPreview ? 'auto' : `${geom().heightMm}mm`,
        'aspect-ratio': props.isPreview ? undefined : `${geom().widthMm} / ${geom().heightMm}`,
      }}
    >


      {/* Certificate Framing */}
      <div class={`min-h-full w-full flex flex-col justify-between ${theme().borderClass}`}>
        {/* Header */}
        <div class={`flex items-center justify-between border-b border-current/15 ${props.isPreview ? 'pb-1.5 sm:pb-3.5' : 'pb-4'}`}>
          <div class="flex items-center">
            <img
              src={assetUrl('/assets/logo.svg')}
              alt="Emblem"
              class={`logo-img ${props.isPreview ? 'h-7 sm:h-12 md:h-16' : 'h-20'} w-auto object-contain shrink-0 block`}
            />
          </div>
          <div class="flex items-center justify-end">
            <div class="qr-box p-0 m-0 bg-transparent">
              <VectorQrCode value={cert().verifyUrl} class={props.isPreview ? 'w-7 h-7 sm:w-12 sm:h-12 md:w-16 md:h-16' : 'w-20 h-20'} />
            </div>
          </div>
        </div>

        {/* Central Citation */}
        <div class={`my-auto text-center ${props.isPreview ? 'px-1 sm:px-6 py-1.5 sm:py-4' : 'px-8 py-4'}`}>
          {/* Official Document Masthead */}
          <div class={props.isPreview ? 'mb-1 sm:mb-2.5' : 'mb-3.5'}>
            <h2 class={`${
              props.isPreview
                ? (isLandscape() ? 'text-xs sm:text-2xl md:text-3xl' : 'text-xs sm:text-xl md:text-2xl')
                : (isLandscape() ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl')
            } font-bold tracking-[0.06em] sm:tracking-[0.10em] uppercase text-foreground text-center ${props.isPreview ? 'whitespace-normal sm:whitespace-nowrap' : 'whitespace-nowrap'} ${
              isClassic() ? 'font-serif' : 'font-sans'
            }`}>
              {mastheadTitle()}
            </h2>

            <div class={`flex items-center justify-center gap-1.5 sm:gap-2 ${props.isPreview ? 'my-0.5 sm:my-2.5' : 'my-3'} text-current/25`}>
              <div class={`h-px ${props.isPreview ? 'w-6 sm:w-16' : 'w-28'} bg-current opacity-25`}></div>
              <span class={props.isPreview ? 'text-[8px] sm:text-xs' : 'text-sm'}>✦</span>
              <div class={`h-px ${props.isPreview ? 'w-6 sm:w-16' : 'w-28'} bg-current opacity-25`}></div>
            </div>
          </div>

          <p class={`lead-phrase ${props.isPreview ? 'text-[8px] sm:text-xs md:text-sm mb-0.5 sm:mb-2.5' : 'text-sm sm:text-base mb-3'} uppercase tracking-[0.16em] sm:tracking-[0.22em] font-semibold opacity-65`}>
            {leadPhrase()}
          </p>
          
          <h1 class={`${props.isPreview ? 'text-base sm:text-3xl md:text-4xl lg:text-5xl mb-1 sm:mb-3.5' : 'text-5xl sm:text-6xl mb-4'} font-bold tracking-tight text-foreground ${theme().fontFamilyHeading}`}>
            {cert().recipient}
          </h1>

          <p class={`citation-body ${props.isPreview ? 'text-[10px] sm:text-sm md:text-base max-w-2xl px-1 sm:px-4' : 'text-lg sm:text-xl max-w-4xl px-6 leading-[1.8]'} mx-auto leading-relaxed text-foreground/85`}>
            {fullCitation()}
          </p>
        </div>

        {/* Footer: Signatures & Centered Seal */}
        <div class={`flex items-end justify-between border-t border-current/15 ${props.isPreview ? 'pt-2 pb-1 sm:pt-4 sm:pb-2' : 'pt-6'} gap-1 sm:gap-4`}>
          {/* Signatory 1 */}
          <div class={`signature-col ${props.isPreview ? 'w-24 sm:w-44 md:w-48' : 'w-56'} text-center`}>
            {/* Signature headroom reserved for physical wet-ink signing */}
            <div class={`signature-space ${props.isPreview ? 'h-3 sm:h-7' : 'h-10'}`} />
            <div class="border-t border-current/50 pt-1">
              <p class={`signatory-name ${props.isPreview ? 'text-[9px] sm:text-xs md:text-sm' : 'text-base'} font-bold truncate text-foreground leading-tight`}>{cert().sig1Name}</p>
              <p class={`signatory-title ${props.isPreview ? 'text-[7.5px] sm:text-[10px] md:text-xs' : 'text-xs sm:text-sm'} opacity-75 truncate leading-tight mt-0.5`}>{cert().sig1Title}</p>
            </div>
          </div>

          {/* Official Seal Centered Between Signatures */}
          <div class="flex items-center justify-center shrink-0">
            <img src={theme().sealAssetPath} alt="Seal" class={`seal-img ${props.isPreview ? 'h-8 w-8 sm:h-14 sm:w-14 md:h-16 md:w-16' : 'h-22 w-22'} object-contain drop-shadow-xs`} />
          </div>

          {/* Signatory 2 */}
          <div class={`signature-col ${props.isPreview ? 'w-24 sm:w-44 md:w-48' : 'w-56'} text-center`}>
            {cert().sig2Name ? (
              <>
                <div class={`signature-space ${props.isPreview ? 'h-3 sm:h-7' : 'h-10'}`} />
                <div class="border-t border-current/50 pt-1">
                  <p class={`signatory-name ${props.isPreview ? 'text-[9px] sm:text-xs md:text-sm' : 'text-base'} font-bold truncate text-foreground leading-tight`}>{cert().sig2Name}</p>
                  <p class={`signatory-title ${props.isPreview ? 'text-[7.5px] sm:text-[10px] md:text-xs' : 'text-xs sm:text-sm'} opacity-75 truncate leading-tight mt-0.5`}>{cert().sig2Title}</p>
                </div>
              </>
            ) : (
              <div class="text-center">
                <div class={`signature-space ${props.isPreview ? 'h-3 sm:h-7' : 'h-10'}`} />
                <div class={`border-t border-current/30 ${props.isPreview ? 'w-20 sm:w-32' : 'w-44'} mx-auto pt-1`}>
                  <p class="text-[7.5px] sm:text-[10px] opacity-50">Verified Authority</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
