'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { Participant } from '@/lib/types';

interface LeaderboardProps {
  participants: Participant[];
  currentParticipantId?: string;
  compact?: boolean;
}

export default function Leaderboard({
  participants,
  currentParticipantId,
  compact = false,
}: LeaderboardProps) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  const displayList = compact ? sorted.slice(0, 5) : sorted;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-400" size={20} />;
      case 2:
        return <Medal className="text-gray-300" size={20} />;
      case 3:
        return <Medal className="text-amber-600" size={20} />;
      default:
        return <span className="text-gray-500 text-sm font-mono w-5 text-center">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400/10 border-yellow-400/30';
      case 2:
        return 'bg-gray-300/10 border-gray-300/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-gray-800/50 border-gray-700/50';
    }
  };

  return (
    <div className={`w-full ${compact ? 'max-w-sm' : 'max-w-2xl'} mx-auto`}>
      {!compact && (
        <h3 className="text-xl font-bold text-white text-center mb-4 flex items-center justify-center gap-2">
          <TrendingUp size={24} className="text-purple-400" />
          Leaderboard
        </h3>
      )}

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayList.map((participant, index) => {
            const rank = index + 1;
            const isMe = participant.id === currentParticipantId;

            return (
              <motion.div
                key={participant.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  getRankBg(rank)
                } ${isMe ? 'ring-2 ring-purple-400' : ''}`}
              >
                <div className="w-8 flex justify-center">{getRankIcon(rank)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isMe ? 'text-purple-300' : 'text-white'}`}>
                    {participant.name}
                    {isMe && <span className="text-purple-400 text-xs ml-2">(Tú)</span>}
                  </p>
                  {!compact && (
                    <p className="text-xs text-gray-500">
                      {participant.answers_correct}/{participant.answers_total} correctas
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{participant.score.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">pts</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {compact && sorted.length > 5 && (
        <p className="text-center text-gray-500 text-sm mt-2">
          +{sorted.length - 5} más
        </p>
      )}
    </div>
  );
}
