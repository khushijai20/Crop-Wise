import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Kisan 🌱 | AI-Powered Smart Agriculture & Crop Recommendation',
  description: 'Right Crop. Right Season. Better Farming. Location-specific weather, verified soil health, and ICAR crop recommendations for Indian farmers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌱</text></svg>" />
      </head>
      <body className="antialiased selection:bg-kisan-200 selection:text-kisan-900">
        {children}
      </body>
    </html>
  );
}
