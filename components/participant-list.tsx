'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi } from 'lucide-react';

interface ParticipantListProps {
  participants: { name: string; id?: string }[];
}

export default function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Users className="text-purple-400" size={20} />
        <h3 className="text-lg font-semibold text-white">
          Participantes ({participants.length})
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <AnimatePresence mode="popLayout">
          {participants.map((p, i) => (
            <motion.div
              key={p.id || i}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: i * 0.05 }}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-2"
            >
              <Wifi size={12} className="text-green-400" />
              <span className="text-white text-sm font-medium">{p.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {participants.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 text-center text-sm mt-4"
        >
          Esperando a que se unan participantes...
        </motion.p>
      )}
    </div>
  );
}
