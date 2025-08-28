"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface MouseCurtainGradientProps {
  intensity?: 'subtle' | 'medium' | 'dramatic';
  className?: string;
}

/**
 * Mouse Spotlight Effect - A dramatic gradient that creates a spotlight following your mouse
 * The rest of the screen fades to dark, creating a curtain/vignette effect
 */
export const MouseSpotlightGradient: React.FC<MouseCurtainGradientProps> = ({
  intensity = 'dramatic',
  className = ""
}) => {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  
  const intensityConfig = {
    subtle: { spotSize: 800, darkness: 0.4, spotOpacity: 0.8 },
    medium: { spotSize: 600, darkness: 0.7, spotOpacity: 0.6 },
    dramatic: { spotSize: 400, darkness: 0.9, spotOpacity: 0.3 }
  };
  
  const config = intensityConfig[intensity];

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  if (!mounted) {
    return (
      <div className={`absolute inset-0 ${className}`}>
        <div className="absolute inset-0 bg-black/30" />
      </div>
    );
  }

  return (
    <motion.div 
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        background: `
          radial-gradient(
            circle ${config.spotSize}px at ${mousePos.x}% ${mousePos.y}%, 
            transparent ${config.spotOpacity * 100}%,
            rgba(0, 0, 0, ${config.darkness * 0.3}) ${(config.spotOpacity * 100) + 10}%,
            rgba(0, 0, 0, ${config.darkness * 0.6}) ${(config.spotOpacity * 100) + 30}%,
            rgba(0, 0, 0, ${config.darkness}) 100%
          )
        `
      }}
      animate={{
        opacity: [0.8, 1, 0.9],
      }}
      transition={{
        opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      }}
    />
  );
};

/**
 * Animated Dark Vignette - Creates flowing dark curtains around the edges
 */
export const AnimatedDarkVignette: React.FC<MouseCurtainGradientProps> = ({
  intensity = 'medium',
  className = ""
}) => {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  
  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  if (!mounted) {
    return (
      <div className={`absolute inset-0 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/40" />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Main dark overlay that lightens near mouse */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse 1000px 800px at ${mousePos.x}% ${mousePos.y}%, 
              rgba(0, 0, 0, 0.1) 0%,
              rgba(0, 0, 0, 0.4) 40%,
              rgba(0, 0, 0, 0.8) 80%,
              rgba(0, 0, 0, 0.95) 100%
            )
          `,
        }}
        animate={{
          opacity: [0.7, 0.9, 0.8],
        }}
        transition={{
          opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      
      {/* Flowing curtain effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              ${45 + (mousePos.x - 50) * 0.5}deg,
              transparent 20%,
              rgba(0, 0, 0, 0.3) 50%,
              rgba(0, 0, 0, 0.7) 80%,
              rgba(0, 0, 0, 0.9) 100%
            )
          `,
        }}
        animate={{
          opacity: [0.5, 0.7, 0.6],
        }}
        transition={{
          opacity: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 },
        }}
      />
      
      {/* Animated noise-like texture using CSS gradients */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            repeating-conic-gradient(
              from ${mousePos.x * 3.6}deg at ${mousePos.x}% ${mousePos.y}%,
              transparent 0deg,
              rgba(0, 0, 0, 0.1) 1deg,
              transparent 2deg,
              rgba(0, 0, 0, 0.05) 3deg,
              transparent 4deg
            ),
            repeating-linear-gradient(
              ${90 + mousePos.y}deg,
              transparent 0px,
              rgba(0, 0, 0, 0.03) 1px,
              transparent 2px,
              rgba(0, 0, 0, 0.02) 3px,
              transparent 4px
            )
          `,
        }}
        animate={{
          opacity: [0.2, 0.4, 0.3],
        }}
        transition={{
          opacity: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 },
        }}
      />
    </div>
  );
};

/**
 * Simple Mouse Vignette - Clean dark edges that follow mouse
 */
export const SimpleMouseVignette: React.FC<MouseCurtainGradientProps> = ({
  intensity = 'medium',
  className = ""
}) => {
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  
  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  if (!mounted) {
    return (
      <div className={`absolute inset-0 ${className}`}>
        <div className="absolute inset-0 bg-black/20" />
      </div>
    );
  }

  const intensityMap = {
    subtle: 0.3,
    medium: 0.6,
    dramatic: 0.85
  };

  return (
    <motion.div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: `
          radial-gradient(
            circle 600px at ${mousePos.x}% ${mousePos.y}%, 
            transparent 0%,
            rgba(0, 0, 0, ${intensityMap[intensity] * 0.3}) 50%,
            rgba(0, 0, 0, ${intensityMap[intensity]}) 100%
          )
        `,
      }}
      animate={{
        opacity: [0.8, 1, 0.9],
      }}
      transition={{
        opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      }}
    />
  );
};

// Easy-to-use presets
export const HeroGradient = () => (
  <MouseSpotlightGradient intensity="dramatic" />
);

export const SectionGradient = () => (
  <AnimatedDarkVignette intensity="medium" />
);

export const SubtleGradient = () => (
  <SimpleMouseVignette intensity="subtle" />
);

// Alternative exports
export const DramaticSpotlight = () => (
  <MouseSpotlightGradient intensity="dramatic" />
);

export const FlowingCurtain = () => (
  <AnimatedDarkVignette intensity="medium" />
);

export const CleanVignette = () => (
  <SimpleMouseVignette intensity="medium" />
);
