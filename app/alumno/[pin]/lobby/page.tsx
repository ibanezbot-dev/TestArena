'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Play, Loader2, ArrowLeft, Wifi } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useExamRealtime } from '@/hooks/use-exam-realtime';
import ParticipantList from '@/components/participant-list';
import { Exam, Participant } from '@/lib/types';

export default function LobbyPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [participantName, setParticipantName] = useState('');

  // Load exam data
  useEffect(() => {
    const loadExam = async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('pin', pin)
        .single();

      if (error || !data) {
        router.push('/');
        return;
      }

      setExam(data as Exam);
      setIsHost(sessionStorage.getItem('is_host') === 'true' && sessionStorage.getItem('exam_id') === data.id);
      setParticipantName(sessionStorage.getItem('participant_name') || '');
      setLoading(false);
    };

    loadExam();
  }, [pin, router]);

  // Load participants
  useEffect(() => {
    if (!exam) return;

    const loadParticipants = async () => {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('exam_id', exam.id);

      if (data) setParticipants(data as Participant[]);
    };

    loadParticipants();

    // Listen for new participants
    const channel = supabase
      .channel(`lobby-participants:${exam.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `exam_id=eq.${exam.id}` },
        (payload) => {
          setParticipants((prev) => [...prev, payload.new as Participant]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [exam]);

  // Realtime channel for game events
  const { broadcast, isConnected } = useExamRealtime({
    pin,
    participantName: isHost ? 'Profesor' : participantName,
    onBroadcast: (payload) => {
      if (payload.type === 'START_EXAM') {
        router.push(`/alumno/${pin}/play`);
      }
    },
    enabled: !!exam,
  });

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartExam = async () => {
    if (!exam) return;
    setStarting(true);

    // Update exam status
    await supabase
      .from('exams')
      .update({ status: 'active', current_question: 0 })
      .eq('id', exam.id);

    // Broadcast start event
    await broadcast({ type: 'START_EXAM' });

    // Navigate host to play page
    router.push(`/alumno/${pin}/play`);
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-400" size={40} />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Salir
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Exam info */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">{exam?.name}</h1>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Wifi size={14} className={isConnected ? 'text-green-400' : 'text-red-400'} />
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Conectado' : 'Conectando...'}
              </span>
            </div>
          </div>

          {/* PIN display */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center"
          >
            <p className="text-sm text-gray-400 mb-2">PIN del Examen</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-5xl font-black text-white tracking-[0.3em] font-mono">
                {pin}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCopyPin}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check size={20} className="text-green-400" />
                ) : (
                  <Copy size={20} className="text-gray-300" />
                )}
              </motion.button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Comparte este PIN con tus alumnos
            </p>
          </motion.div>

          {/* Participants */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <ParticipantList
              participants={participants.map((p) => ({ name: p.name, id: p.id }))}
            />
          </div>

          

          {/* Student waiting message */}
          {!isHost && (
            <div className="text-center py-4">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-gray-400"
              >
                Esperando a que el profesor inicie el examen...
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
