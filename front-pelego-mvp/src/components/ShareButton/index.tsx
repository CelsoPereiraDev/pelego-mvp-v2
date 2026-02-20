'use client';

import { RefObject, useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  targetRef?: RefObject<HTMLElement>;
  className?: string;
}

export function ShareButton({ title, text, url, targetRef, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');

  async function captureImage(): Promise<File | null> {
    if (!targetRef?.current) return null;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      return await new Promise<File | null>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) return resolve(null);
          resolve(new File([blob], 'pelego-stats.png', { type: 'image/png' }));
        }, 'image/png');
      });
    } catch {
      return null;
    }
  }

  async function handleShare() {
    setLoading(true);
    try {
      if (navigator.share) {
        const shareData: ShareData = { title, text, url: shareUrl };

        if (targetRef?.current) {
          const file = await captureImage();
          if (file && navigator.canShare?.({ files: [file] })) {
            shareData.files = [file];
            delete shareData.url;
          }
        }

        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast({ title: 'Link copiado!', description: 'Cole no WhatsApp ou onde quiser.' });
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        // Fallback to clipboard if share fails
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({ title: 'Link copiado!', description: 'Cole no WhatsApp ou onde quiser.' });
        } catch {
          toast({ title: 'Não foi possível compartilhar', variant: 'destructive' });
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      aria-label="Compartilhar"
      className={`inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50 ${className ?? ''}`}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {loading ? 'Gerando...' : copied ? 'Copiado!' : 'Compartilhar'}
    </button>
  );
}
