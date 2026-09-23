'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Plus, LogIn, Zap, Trophy, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center relative z-10 mb-16"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-2xl mb-6"
        >
          <GraduationCap size={48} className="text-purple-400" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-4">
          Test
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Arena
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-lg mx-auto">
          Competencia de exámenes en tiempo real.\nDemuestra tus conocimientos y compite con tus compañeros.
        </p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 relative z-10 mb-20"
      >
        <Link href="/profesor/create">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors animate-pulse-glow"
          >
            <Plus size={24} />
            Crear Examen
          </motion.button>
        </Link>

        <Link href="/alumno/join">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-4 rounded-2xl text-lg border border-gray-700 transition-colors"
          >
            <LogIn size={24} />
            Unirse a Examen
          </motion.button>
        </Link>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl relative z-10"
      >
        {[
          {
            icon: Zap,
            title: 'Tiempo Real',
            desc: 'Competencia sincronizada entre todos los participantes',
            color: 'text-yellow-400',
          },
          {
            icon: Trophy,
            title: 'Leaderboard',
            desc: 'Clasificación en vivo con puntuación por velocidad',
            color: 'text-purple-400',
          },
          {
            icon: Users,
            title: 'Multijugador',
            desc: 'Compite con todos tus compañeros al mismo tiempo',
            color: 'text-blue-400',
          },
          {
            icon: BarChart3,
            title: 'Analíticas',
            desc: 'Análisis detallado por tema y pregunta',
            color: 'text-green-400',
          },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 text-center hover:bg-gray-800/50 transition-colors"
          >
            <feature.icon className={`mx-auto mb-3 ${feature.color}`} size={32} />
            <h3 className="text-white font-bold mb-1">{feature.title}</h3>
            <p className="text-gray-500 text-sm">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}
