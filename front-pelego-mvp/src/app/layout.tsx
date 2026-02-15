import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import AppShell from '@/components/AppShell';
import { Toaster } from '@/components/ui/toaster';

const otherFontFamily = localFont({
  src: '../../public/sans.woff',
  display: 'swap',
  variable: '--font-main',
});

export const metadata: Metadata = {
  title: 'Pelego MVP - Gestão Inteligente de Futebol',
  description:
    'Plataforma completa para gestão de estatísticas, times e premiações do seu futebol amador',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={otherFontFamily.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pelego_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
