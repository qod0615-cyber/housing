import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Housing - 스마트 도면 배치어',
    short_name: 'Housing',
    description: '모바일 & PC 맞춤형 가구 및 방 실측 도면 배치 시뮬레이터',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#020617',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
