import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EVPULSE - Drive Electric. Buy Smart.',
    short_name: 'EVPULSE',
    description: 'Buy, rent, sell and service EV & Hybrid vehicles in one place. Your trusted EV marketplace in India.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/globe.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
