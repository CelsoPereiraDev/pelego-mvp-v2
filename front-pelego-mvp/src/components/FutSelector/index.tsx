'use client';

import { useFut } from '@/contexts/FutContext';
import { ChevronDownIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface FutSelectorProps {
  collapsed?: boolean;
}

export default function FutSelector({ collapsed = false }: FutSelectorProps) {
  const { futId, futName, futs, switchFut } = useFut();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (futs.length <= 1) {
    if (collapsed) {
      return (
        <div className="flex items-center justify-center px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{futName?.[0] || 'F'}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Fut</p>
        <p className="text-sm font-medium truncate">{futName || 'Sem fut'}</p>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="flex items-center justify-center px-2 py-2">
        <div
          className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}>
          <span className="text-xs font-bold text-primary">{futName?.[0] || 'F'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-3 py-2" ref={dropdownRef}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fut</p>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm">
        <span className="font-medium truncate">{futName}</span>
        <ChevronDownIcon
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
          {futs.map((fut) => (
            <button
              key={fut.id}
              onClick={() => {
                switchFut(fut.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                fut.id === futId ? 'bg-primary/10 text-primary font-medium' : ''
              }`}>
              {fut.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
