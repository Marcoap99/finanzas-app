import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        background: '#4F46E5',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '110px',
      }}>
        <span style={{ color: 'white', fontSize: 200, fontWeight: 'bold', fontFamily: 'sans-serif' }}>
          S/
        </span>
      </div>
    ),
    { ...size }
  )
}
