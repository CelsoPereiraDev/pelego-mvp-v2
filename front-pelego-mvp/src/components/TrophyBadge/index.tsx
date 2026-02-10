'use client'

import { cn } from "@/lib/utils";
import React from "react";

export type TrophyTier = "legend" | "elite" | "common" | "mvp";

export interface TrophyBadgeProps {
  tier: TrophyTier;
  label: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  animated?: boolean;
}

export const TrophyBadge: React.FC<TrophyBadgeProps> = ({
  tier,
  label,
  icon,
  size = "md",
  className,
  animated = true,
}) => {
  const tierStyles = {
    legend: {
      bg: "bg-gradient-gold",
      shadow: "shadow-tier-gold",
      text: "text-white",
      border: "border-[hsl(var(--tier-legend))]",
      glow: "glow-pitch",
    },
    elite: {
      bg: "bg-gradient-to-br from-gray-300 to-gray-400",
      shadow: "shadow-tier-silver",
      text: "text-gray-900",
      border: "border-[hsl(var(--tier-elite))]",
      glow: "",
    },
    common: {
      bg: "bg-gradient-to-br from-orange-400 to-orange-600",
      shadow: "shadow-tier-bronze",
      text: "text-white",
      border: "border-[hsl(var(--tier-common))]",
      glow: "",
    },
    mvp: {
      bg: "bg-gradient-to-br from-purple-500 to-purple-700",
      shadow: "shadow-lg",
      text: "text-white",
      border: "border-[hsl(var(--tier-mvp))]",
      glow: "",
    },
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const styles = tierStyles[tier];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border-2 font-bold uppercase tracking-wide transition-all duration-300",
        styles.bg,
        styles.shadow,
        styles.text,
        styles.border,
        animated && styles.glow,
        animated && "hover:scale-105",
        animated && tier === "legend" && "animate-trophy",
        sizeStyles[size],
        className
      )}
    >
      {icon && (
        <div className={cn("flex-shrink-0", iconSizes[size])}>
          {icon}
        </div>
      )}
      <span>{label}</span>
    </div>
  );
};

// Trophy Icon Component
export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 2h12v3h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-.5c-.5 2.5-2.5 4.5-5.5 5v3h2a2 2 0 0 1 2 2v1H6v-1a2 2 0 0 1 2-2h2v-3c-3-0.5-5-2.5-5.5-5H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V2zm0 3H4v3h2V5zm14 0v3h2V5h-2z" />
  </svg>
);

// Medal Icon Component
export const MedalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L9 9H2l6 4.5L5 22l7-5 7 5-3-8.5L22 9h-7l-3-7zm0 4.25L13.5 10h3.75l-3 2.25 1.125 3.75L12 13.5l-3.375 2.5 1.125-3.75L6.75 10h3.75L12 6.25z" />
  </svg>
);

// Star Icon Component
export const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default TrophyBadge;
