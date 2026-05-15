import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  GraduationCap,
  Clock,
  Map,
  Zap,
} from 'lucide-react';

/**
 * JourneyAnimation Component
 * 
 * Premium 3D folder animation with shuffling stat cards.
 * Three phases:
 * Phase 1: Logo pulse + tagline (0.9s)
 * Phase 2: Folder opens + cards shuffle with status messages (5.2s)
 * Phase 3: Progress bar fills + dramatic slide up (1.4s)
 * 
 * CSS Variables Required:
 * --c-primary: Crimson/brand color (e.g., #c41e3a)
 * --c-primary-dark: Dark crimson (e.g., #8b1a2e)
 * 
 * Props:
 * - level: string (e.g., "Intermediate")
 * - dailyGoal: number (words per session, e.g., 10)
 * - totalUnits: number (e.g., 138)
 * - onAnimationComplete: function (called when animation finishes)
 */

export const JourneyAnimation = ({
  level = 'Intermediate',
  dailyGoal = 10,
  totalUnits = 138,
  onAnimationComplete = () => {},
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState('logo'); // logo | cards | complete

  // Card data with icons and status messages
  const cards = [
    {
      id: 'level',
      icon: GraduationCap,
      message: 'Identifying your level',
    },
    {
      id: 'goal',
      icon: Clock,
      message: 'Setting your pace',
    },
    {
      id: 'sessions',
      icon: Map,
      message: 'Building your roadmap',
    },
    {
      id: 'timeline',
      icon: Zap,
      message: 'Planning your journey',
    },
  ];

  // Reduced motion: show final state immediately
  if (prefersReducedMotion) {
    useEffect(() => {
      const timer = setTimeout(() => {
        setPhase('complete');
        onAnimationComplete();
      }, 300);
      return () => clearTimeout(timer);
    }, [onAnimationComplete]);

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#c41e3a] to-[#8b1a2e] flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="text-6xl font-bold mb-4">V</div>
          <p className="text-lg mb-12">Your path is ready</p>
          <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-full bg-white rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Phase transitions
  useEffect(() => {
    if (phase === 'logo') {
      const timer = setTimeout(() => setPhase('cards'), 900);
      return () => clearTimeout(timer);
    }
    if (phase === 'cards') {
      const timer = setTimeout(() => setPhase('complete'), 5200);
      return () => clearTimeout(timer);
    }
    if (phase === 'complete') {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, onAnimationComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#c41e3a] to-[#8b1a2e] flex items-center justify-center z-50 overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Phase 1: Logo + Tagline */}
        {phase === 'logo' && (
          <motion.div
            key="phase1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          >
            {/* Logo V */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
              }}
              className="relative"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{
                  duration: 0.9,
                  ease: 'easeInOut',
                  repeat: Infinity,
                }}
                className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
              >
                <span className="text-6xl font-bold text-white">V</span>
              </motion.div>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: 'easeOut',
              }}
              role="status"
              aria-live="polite"
              className="text-white text-lg font-medium text-center"
            >
              Setting up your journey
            </motion.p>
          </motion.div>
        )}

        {/* Phase 2: Folder + Cards + Status Messages */}
        {phase === 'cards' && (
          <motion.div
            key="phase2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-4"
          >
            {/* 3D Folder Box Container */}
            <div 
              className="relative w-80 h-64"
              style={{
                perspective: '1200px',
              }}
            >
              {/* Folder Back Wall */}
              <div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#a01a2a] to-[#7a1520] backdrop-blur-sm border border-white/10 shadow-2xl"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(60px)',
                }}
              />

              {/* Folder Bottom Depth */}
              <div
                className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent rounded-b-3xl"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(75deg) translateY(100%)',
                  transformOrigin: 'center bottom',
                }}
              />

              {/* Card Carousel */}
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {cards.map((card, idx) => (
                    <CardInBox key={card.id} card={card} index={idx} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Status Message */}
            <StatusMessage cards={cards} />
          </motion.div>
        )}

        {/* Phase 3: Progress + Final State */}
        {phase === 'complete' && (
          <motion.div
            key="phase3"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{
              duration: 0.6,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-8"
          >
            {/* Final text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-white text-2xl font-semibold text-center px-4"
            >
              Your path is ready
            </motion.p>

            {/* Progress bar */}
            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 1,
                  ease: 'easeInOut',
                }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide up curtain effect */}
      {phase === 'complete' && (
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: '-100%' }}
          transition={{
            duration: 0.8,
            delay: 0.8,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-br from-[#c41e3a] to-[#8b1a2e] pointer-events-none"
        />
      )}
    </div>
  );
};

/**
 * CardInBox — Individual card that shuffles in the folder
 * Animation: appears at back → floats forward → moves to front → fades out
 */
function CardInBox({ card, index }) {
  const IconComponent = card.icon;
  const cardDelay = index * 1.3; // Each card starts 1.3s after previous

  return (
    <motion.div
      key={card.id}
      initial={{
        opacity: 0,
        y: 20,
        z: -80,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [20, -12, -12, -100],
        z: [-80, 0, 40, -120],
        scale: [0.85, 1, 1, 0.75],
      }}
      transition={{
        duration: 1.3,
        delay: cardDelay,
        times: [0, 0.12, 0.65, 1],
        ease: 'easeInOut',
      }}
      className="absolute w-40 h-40 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        animate={{
          y: [0, -6, -6, 0],
        }}
        transition={{
          duration: 1.3,
          delay: cardDelay,
          times: [0, 0.12, 0.65, 1],
          ease: 'easeInOut',
        }}
      >
        <IconComponent 
          size={56} 
          className="text-white/80" 
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * StatusMessage — Cycles through each card's message
 */
function StatusMessage({ cards }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % cards.length);
    }, 1300); // Match card animation duration
    return () => clearInterval(interval);
  }, [cards.length]);

  return (
    <div className="h-8 flex items-center justify-center" role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-white/70 text-sm font-medium text-center"
        >
          {cards[messageIndex].message}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}