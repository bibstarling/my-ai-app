import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          BS
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
