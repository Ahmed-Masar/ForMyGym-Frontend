export default function manifest() {
  return {
    name: 'MASAR',
    short_name: 'MASAR',
    description: 'Your path. Your records.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    orientation: 'portrait',
    icons: [
      { src: '/icon',       sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
