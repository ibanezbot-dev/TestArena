'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  totalSeconds: number;
  isRunning: boolean;
  onTimeUp: () => void;
  onTick?: (secondsLeft: number) => void;
}

export default function Timer({ totalSeconds, isRunning, onTimeUp, onTick }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledTimeUp = useRef(false);

  useEffect(() => {
    setTimeLeft(totalSeconds);
    hasCalledTimeUp.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          onTick?.(next);
          if (next <= 0 && !hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            setTimeout(() => onTimeUp(), 0);
          }
          return Math.max(0, next);
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, onTimeUp, onTick]);

  const progress = timeLeft / totalSeconds;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (progress > 0.5) return '#4ade80'; // green
    if (progress > 0.25) return '#facc15'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" className="-rotate-90">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#374151"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={timeLeft}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-3xl font-bold ${
            progress > 0.25 ? 'text-white' : 'text-red-400'
          }`}
        >
          {timeLeft}
        </motion.span>
      </div>
      {timeLeft <= 5 && timeLeft > 0 && isRunning && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute inset-0 rounded-full border-2 border-red-400/30"
        />
      )}
    </div>
  );
}
