import { renderSVG } from 'uqr';

interface Props {
  value: string;
  class?: string;
}

export default function VectorQrCode(props: Props) {
  const svgString = () => {
    try {
      return renderSVG(props.value || 'https://verify.example.com', { border: 1 });
    } catch {
      return '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#f1f5f9"/></svg>';
    }
  };

  return (
    <div
      class={`inline-block overflow-hidden bg-white p-1 shadow-sm [&>svg]:w-full [&>svg]:h-full ${props.class || 'w-24 h-24'}`}
      innerHTML={svgString()}
    />
  );
}
