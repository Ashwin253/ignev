import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EVPLSE - Drive Electric. Buy Smart.',
    short_name: 'EVPLSE',
    description: 'Buy, rent, sell and service EV & Hybrid vehicles in one place. Your trusted EV marketplace in India.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/images/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    // @ts-ignore - Next.js MetadataRoute.Manifest may not include share_target yet
    share_target: {
      action: '/nearmelite',
      method: 'GET',
      enctype: 'application/x-www-form-urlencoded',
      params: {
        title: 'title',
        text: 'text',
        url: 'url'
      }
    }
  }
}
