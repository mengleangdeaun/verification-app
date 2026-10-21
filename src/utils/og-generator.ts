import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import { renderSVG } from 'uqr';
import type { CertificateRecord } from '../types/certificates';

// In-memory singletons for fonts and SVG assets
let cachedInterFont: Buffer | null = null;
let cachedCinzelFont: Buffer | null = null;
let cachedLogoData: string | null = null;
let cachedSealData: string | null = null;

function loadAssets() {
  if (!cachedInterFont) {
    const interPath = path.resolve('public/fonts/Inter-SemiBold.ttf');
    cachedInterFont = fs.readFileSync(interPath);
  }
  if (!cachedCinzelFont) {
    const cinzelPath = path.resolve('public/fonts/Cinzel-Bold.ttf');
    cachedCinzelFont = fs.readFileSync(cinzelPath);
  }
  if (!cachedLogoData) {
    const logoSvg = fs.readFileSync(path.resolve('public/assets/logo.svg'), 'utf8');
    cachedLogoData = 'data:image/svg+xml;base64,' + Buffer.from(logoSvg).toString('base64');
  }
  if (!cachedSealData) {
    const sealSvg = fs.readFileSync(path.resolve('public/assets/seal.svg'), 'utf8');
    cachedSealData = 'data:image/svg+xml;base64,' + Buffer.from(sealSvg).toString('base64');
  }

  return {
    interFont: cachedInterFont,
    cinzelFont: cachedCinzelFont,
    logoData: cachedLogoData,
    sealData: cachedSealData,
  };
}

export async function generateCertificateOgImage(record: CertificateRecord): Promise<Buffer> {
  const { interFont, cinzelFont, logoData, sealData } = loadAssets();

  const verifyUrl = `https://scc-group.asia/certification/check?id=${record.id}&sig=${encodeURIComponent(record.signature || '')}`;
  const qrSvg = renderSVG(verifyUrl, { border: 0, whiteColor: 'transparent' });
  const qrData = 'data:image/svg+xml;base64,' + Buffer.from(qrSvg).toString('base64');

  const docTitle = record.docType === 'PROMOTION' ? 'LETTER OF PROMOTION'
    : record.docType === 'QUALIFICATION' ? 'CERTIFICATE OF QUALIFICATION'
    : record.docType === 'APPRECIATION' ? 'LETTER OF APPRECIATION'
    : (record.programTitle?.toUpperCase().includes('CERTIFICATE') ? record.programTitle.toUpperCase() : 'CERTIFICATE OF COMPLETION');

  const leadPhrase = record.docType === 'PROMOTION' ? 'THIS IS TO CERTIFY THE PROMOTION OF'
    : record.docType === 'QUALIFICATION' ? 'THIS IS TO CERTIFY THAT'
    : record.docType === 'APPRECIATION' ? 'THIS LETTER OF APPRECIATION IS PRESENTED TO'
    : 'THIS IS TO CERTIFY THAT';

  const issueDateFormatted = record.issueDate ? new Date(record.issueDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : '';

  const expiryDateFormatted = record.expiryDate ? new Date(record.expiryDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : '';

  let citation = record.description || '';
  if (!citation) {
    if (record.docType === 'QUALIFICATION') {
      citation = `has fulfilled all qualification standards and is officially certified as '${record.programTitle}'`;
    } else if (record.docType === 'PROMOTION') {
      citation = `has demonstrated distinguished performance and is officially promoted to the position of '${record.programTitle}'`;
    } else if (record.docType === 'APPRECIATION') {
      citation = `in sincere appreciation for outstanding dedication, professional excellence, and valuable contributions to '${record.programTitle}'`;
    } else {
      citation = `has successfully completed all prescribed courses and practical training requirements in '${record.programTitle}'`;
    }
  }

  const dateCitation = issueDateFormatted 
    ? (expiryDateFormatted 
        ? ` on ${issueDateFormatted}, valid until ${expiryDateFormatted}.` 
        : ` on ${issueDateFormatted}.`)
    : '.';

  const markup = html`
    <div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background-color: #faf8f5; padding: 24px; box-sizing: border-box;">
      <!-- Outer Double Border Frame -->
      <div style="display: flex; flex-direction: column; justify-content: space-between; width: 100%; height: 100%; border: 4px solid #b4823c; padding: 8px; box-sizing: border-box;">
        <div style="display: flex; flex-direction: column; justify-content: space-between; width: 100%; height: 100%; border: 1.5px solid #d4af37; padding: 24px 36px; box-sizing: border-box; background: #ffffff;">
          
          <!-- Top Bar: Logo & QR Code (Matching Official Certificate Paper) -->
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 1.5px solid #e8dfcf; padding-bottom: 14px;">
            <div style="display: flex; align-items: center;">
              <img src="${logoData}" style="height: 56px; width: 115px;" />
            </div>

            <!-- QR Code -->
            <div style="display: flex; align-items: center;">
              <img src="${qrData}" style="width: 56px; height: 56px;" />
            </div>
          </div>

          <!-- Certificate Body -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin-top: 10px; margin-bottom: 10px;">
            <!-- Document Title -->
            <div style="font-family: Cinzel; font-size: 26px; font-weight: 700; color: #1e293b; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 4px;">
              ${docTitle}
            </div>

            <!-- Divider with Diamond -->
            <div style="display: flex; align-items: center; justify-content: center; width: 260px; margin-bottom: 10px;">
              <div style="flex: 1; height: 1.5px; background: #b4823c; opacity: 0.6;"></div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#b4823c" style="margin: 0 10px;">
                <polygon points="12 2 22 12 12 22 2 12"></polygon>
              </svg>
              <div style="flex: 1; height: 1.5px; background: #b4823c; opacity: 0.6;"></div>
            </div>

            <!-- Lead Phrase -->
            <div style="font-family: Inter; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px;">
              ${leadPhrase}
            </div>

            <!-- Recipient Name -->
            <div style="font-family: Cinzel; font-size: 44px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px; margin-bottom: 10px;">
              ${record.recipientName}
            </div>

            <!-- Citation -->
            <div style="font-family: Inter; font-size: 14px; color: #334155; line-height: 1.6; max-width: 860px; text-align: center;">
              ${citation}${dateCitation}
            </div>
          </div>

          <!-- Bottom Row: Signatories & Gold Seal -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%; border-top: 1.5px solid #e8dfcf; padding-top: 12px;">
            <!-- Signatory 1 -->
            <div style="display: flex; flex-direction: column; align-items: center; width: 240px; text-align: center;">
              <div style="width: 100%; border-bottom: 1.5px solid #94a3b8; padding-bottom: 4px; margin-bottom: 4px;">
                <span style="font-family: Inter; font-size: 14px; font-weight: 700; color: #0f172a;">
                  ${record.signatory1Name || 'Authorized Signatory'}
                </span>
              </div>
              <span style="font-family: Inter; font-size: 11px; color: #64748b;">
                ${record.signatory1Title || 'Executive Director'}
              </span>
            </div>

            <!-- Center Verified Seal -->
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <img src="${sealData}" style="width: 66px; height: 66px;" />
            </div>

            <!-- Signatory 2 -->
            <div style="display: flex; flex-direction: column; align-items: center; width: 240px; text-align: center;">
              <div style="width: 100%; border-bottom: 1.5px solid #94a3b8; padding-bottom: 4px; margin-bottom: 4px;">
                <span style="font-family: Inter; font-size: 14px; font-weight: 700; color: #0f172a;">
                  ${record.signatory2Name || 'Authorized Signatory'}
                </span>
              </div>
              <span style="font-family: Inter; font-size: 11px; color: #64748b;">
                ${record.signatory2Title || 'Registrar General'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: interFont, weight: 600, style: 'normal' },
      { name: 'Cinzel', data: cinzelFont, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}

export async function generateFallbackOgImage(title = 'Certificate Verification Portal', subtitle = 'Official Central Registry'): Promise<Buffer> {
  const { interFont, cinzelFont, logoData, sealData } = loadAssets();

  const markup = html`
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 1200px; height: 630px; background-color: #faf8f5; padding: 48px; border: 14px solid #b4823c; box-sizing: border-box;">
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; border: 2px solid #d4af37; background: #ffffff; padding: 40px; box-sizing: border-box;">
        <img src="${logoData}" style="height: 68px; width: 140px; margin-bottom: 24px;" />
        
        <div style="display: flex; align-items: center; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 9999px; padding: 6px 20px; margin-bottom: 24px;">
          <span style="font-family: Inter; font-size: 14px; font-weight: 700; color: #15803d; letter-spacing: 0.5px;">
            ✓ OFFICIAL VERIFIED CREDENTIAL REGISTRY
          </span>
        </div>

        <div style="font-family: Cinzel; font-size: 38px; font-weight: 700; color: #0f172a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; text-align: center;">
          ${title}
        </div>

        <div style="font-family: Inter; font-size: 18px; color: #64748b; max-width: 700px; text-align: center; margin-bottom: 30px;">
          ${subtitle}
        </div>

        <img src="${sealData}" style="width: 72px; height: 72px;" />
      </div>
    </div>
  `;

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: interFont, weight: 600, style: 'normal' },
      { name: 'Cinzel', data: cinzelFont, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}
