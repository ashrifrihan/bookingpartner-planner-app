import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BookingPartner Backend Planner',
    short_name: 'BP Planner',
    description: 'Today, tomorrow and 12-week backend development task planner.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0c11',
    theme_color: '#0b0c11',
    icons: [
      {
        src: '/bookingpartner.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/bookingpartner.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
