"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface MenuExpansibleProps {
  children: React.ReactNode;
  open: boolean;
  onClick: () => void;
  logo?: React.ReactNode;
}

interface MenuExpansibleItemProps {
  href?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  withSubItems?: boolean;
  forceClosed?: boolean;
  children?: React.ReactNode;
}

export function MenuExpansible({
  children,
  open,
  logo,
  onClick,
}: MenuExpansibleProps) {
  return (
    <aside
      className={`flex flex-col justify-start transition-all duration-300 ease-in-out ${
        open ? "w-64" : "w-20"
      } border-r border-border bg-card/50 backdrop-blur-sm min-h-screen shadow-sm`}
    >
      <div className="flex flex-col h-full">
       <div className="flex flex-row justify-between items-center p-4 border-b border-border/50">
        {open ? (
          <div className="flex items-center gap-2 font-bold text-lg">
            {logo}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className='text-xl font-bold text-primary-foreground'>P</span>
          </div>
        )}
        <button
          onClick={onClick}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className={`flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors ${
            !open ? "ml-auto" : ""
          }`}
        >
          {open ? (
            <ChevronLeftIcon className="w-5 h-5 text-muted-foreground"/>
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-muted-foreground"/>
          )}
        </button>
       </div>
       <div className="flex-1 overflow-y-auto py-4">
         {children}
       </div>
      </div>
    </aside>
  );
}

export function MenuExpansibleItem({
  href,
  label,
  icon,
  active,
  withSubItems = false,
  forceClosed = false,
  children,
}: MenuExpansibleItemProps) {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  if (!withSubItems) {
    return (
      <Link
        href={href || "#"}
        className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-all duration-200 group ${
          active
            ? "bg-primary text-primary-foreground shadow-soft"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        <div className={`${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"}`}>
          {icon}
        </div>
        <span className="flex-1 text-sm font-medium truncate">{label}</span>
      </Link>
    );
  }

  return (
    <div className="my-0.5">
      <button
        onClick={toggleOpen}
        className={`w-full flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-all duration-200 group ${
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        <div className={`${active ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"}`}>
          {icon}
        </div>
        <span className="flex-1 text-sm font-medium truncate text-left">{label}</span>
        {open ? (
          <ChevronUpIcon className="w-4 h-4 flex-shrink-0"/>
        ) : (
          <ChevronDownIcon className="w-4 h-4 flex-shrink-0"/>
        )}
      </button>
      {open && !forceClosed && (
        <div className="flex flex-col pl-8 pr-2 py-1 gap-0.5 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuExpansibleContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col w-full px-3 gap-1">{children}</div>;
}

export function MenuExpansibleLogo({ logo }: { children: React.ReactNode }) {
  return ;
}

export function MenuExpansibleContentHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex relative p-4">{children}</div>;
}
