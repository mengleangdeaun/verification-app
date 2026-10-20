import { renderSVG } from 'uqr';

interface Props {
  value: string;
  class?: string;
}

export default function VectorQrCode(props: Props) {
  const svgString = () => {
    try {
      return renderSVG(props.value || 'https://verify.example.com', {
        border: 0,
        whiteColor: 'transparent',
      });
    } catch {
      return '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="transparent"/></svg>';
    }
  };

  return (
    <div
      class={`inline-block overflow-hidden [&>svg]:w-full [&>svg]:h-full ${props.class || 'w-24 h-24'}`}
      innerHTML={svgString()}
    />
  );
}
