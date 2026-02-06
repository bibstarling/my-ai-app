import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: '32px',
        }}
      >
        <div
          style={{
            fontSize: '100px',
            color: '#ffffff',
            fontFamily: 'sans-serif',
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
