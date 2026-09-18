import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BookingPartner Backend Planner',
    short_name: 'BP Planner',
    description: 'Today, tomorrow and 12-week backend development task planner.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f7fb',
    theme_color: '#6d4aff',
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
