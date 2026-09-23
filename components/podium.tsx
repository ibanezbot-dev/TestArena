'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';
import { Participant } from '@/lib/types';

interface PodiumProps {
  participants: Participant[];
}

export default function Podium({ participants }: PodiumProps) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);

  // Fire confetti on mount
  useEffect(() => {
    const fireConfetti = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default;
        // First burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        // Second burst
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 250);
      } catch (e) {
        // canvas-confetti not available
      }
    };
    fireConfetti();
  }, []);

  const podiumConfig = [
    { order: 1, height: 'h-40', delay: 0.4, color: 'from-yellow-400 to-yellow-600', icon: Trophy, label: '1°' },
    { order: 0, height: 'h-28', delay: 0.6, color: 'from-gray-300 to-gray-500', icon: Medal, label: '2°' },
    { order: 2, height: 'h-20', delay: 0.8, color: 'from-amber-600 to-amber-800', icon: Medal, label: '3°' },
  ];

  // Rearrange: 2nd, 1st, 3rd for visual display
  const displayOrder = [1, 0, 2];

  return (
    <div className="flex items-end justify-center gap-4 mt-8">
      {displayOrder.map((podiumIndex) => {
        const config = podiumConfig[podiumIndex];
        const participant = top3[podiumIndex];
        if (!participant) return null;

        const Icon = config.icon;

        return (
          <motion.div
            key={participant.id}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: config.delay, type: 'spring', stiffness: 100 }}
            className="flex flex-col items-center"
          >
            {/* Avatar/Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: config.delay + 0.3, type: 'spring' }}
              className="mb-3"
            >
              {podiumIndex === 0 && (
                <div className="relative">
                  <Star className="text-yellow-400 absolute -top-3 -right-3" size={20} fill="currentColor" />
                  <Icon size={40} className="text-yellow-400" />
                </div>
              )}
              {podiumIndex !== 0 && <Icon size={32} className={podiumIndex === 1 ? 'text-gray-300' : 'text-amber-600'} />}
            </motion.div>

            {/* Name */}
            <p className="text-white font-bold text-sm mb-1 text-center max-w-[100px] truncate">
              {participant.name}
            </p>
            <p className="text-gray-400 text-xs mb-2">{participant.score.toLocaleString()} pts</p>

            {/* Podium block */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              transition={{ delay: config.delay, duration: 0.5 }}
              className={`w-24 md:w-32 ${config.height} bg-gradient-to-t ${config.color} rounded-t-xl flex items-center justify-center`}
            >
              <span className="text-white font-black text-2xl">{config.label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
