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
          background: 'linear-gradient(135deg, #e07a5f 0%, #d4663f 100%)',
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          👏
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
