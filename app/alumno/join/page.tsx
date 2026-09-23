'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function JoinPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 6) {
      setError('El PIN debe tener 6 dígitos');
      return;
    }

    if (!name.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    setLoading(true);

    try {
      // Check if exam exists
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('pin', pin)
        .single();

      if (examError || !exam) {
        setError('No se encontró un examen con ese PIN');
        setLoading(false);
        return;
      }

      if (exam.status === 'finished') {
        setError('Este examen ya terminó');
        setLoading(false);
        return;
      }

      // Check for duplicate name
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .eq('exam_id', exam.id)
        .eq('name', name.trim());

      if (existing && existing.length > 0) {
        setError('Ese nombre ya está en uso. Elige otro.');
        setLoading(false);
        return;
      }

      // Create participant
      const { data: participant, error: partError } = await supabase
        .from('participants')
        .insert({
          exam_id: exam.id,
          name: name.trim(),
        })
        .select()
        .single();

      if (partError || !participant) {
        setError('Error al unirse. Intenta de nuevo.');
        setLoading(false);
        return;
      }

      // Store participant info in sessionStorage
      sessionStorage.setItem('participant_id', participant.id);
      sessionStorage.setItem('participant_name', participant.name);
      sessionStorage.setItem('exam_id', exam.id);

      // Navigate to lobby
      router.push(`/alumno/${pin}/lobby`);
    } catch (err) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>

        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <LogIn className="mx-auto mb-3 text-blue-400" size={40} />
            <h1 className="text-2xl font-bold text-white">Unirse a Examen</h1>
            <p className="text-gray-400 text-sm mt-1">
              Ingresa el PIN que te dio tu profesor
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">PIN del Examen</label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:tracking-[0.5em] placeholder:text-gray-600 focus:outline-none focus:border-purple-400 transition-colors"
                maxLength={6}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Tu Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa tu alias"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-400 transition-colors"
                maxLength={20}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3"
              >
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || pin.length !== 6 || !name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Unirse
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
