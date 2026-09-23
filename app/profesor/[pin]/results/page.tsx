'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Download, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Podium from '@/components/podium';
import Leaderboard from '@/components/leaderboard';
import AnalyticsDashboard from '@/components/analytics-dashboard';
import { Exam, Participant, Question, Answer } from '@/lib/types';

export default function ResultsPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = use(params);
  const [exam, setExam] = useState<Exam | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<(Question & { id: string })[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      // Load exam
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('pin', pin)
        .single();

      if (!examData) return;
      setExam(examData as Exam);

      const host = sessionStorage.getItem('is_host') === 'true' && sessionStorage.getItem('exam_id') === examData.id;
      setIsHost(host);
      setCurrentParticipantId(sessionStorage.getItem('participant_id'));

      // Load participants
      const { data: partData } = await supabase
        .from('participants')
        .select('*')
        .eq('exam_id', examData.id)
        .order('score', { ascending: false });

      if (partData) setParticipants(partData as Participant[]);

      // Load questions
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examData.id)
        .order('order_num');

      if (qData) setQuestions(qData as (Question & { id: string })[]);

      // Load all answers
      const { data: aData } = await supabase
        .from('answers')
        .select('*')
        .eq('exam_id', examData.id);

      if (aData) setAnswers(aData as Answer[]);

      setLoading(false);
    };

    loadResults();
  }, [pin]);

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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-4xl md:text-5xl font-black text-white mb-2"
            >
              🏆 Resultados
            </motion.h1>
            <p className="text-gray-400">{exam?.name}</p>
          </div>

          {/* Podium */}
          {participants.length >= 1 && (
            <Podium participants={participants} />
          )}

          {/* Full leaderboard */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <Leaderboard
              participants={participants}
              currentParticipantId={currentParticipantId || undefined}
            />
          </div>

          {/* Analytics toggle */}
          {isHost && (
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto"
              >
                <BarChart3 size={20} />
                {showAnalytics ? 'Ocultar' : 'Ver'} Análisis Detallado
              </motion.button>
            </div>
          )}

          {/* Analytics */}
          {showAnalytics && isHost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AnalyticsDashboard
                questions={questions}
                answers={answers}
                participantCount={participants.length}
              />
            </motion.div>
          )}

          {/* Back to home */}
          <div className="text-center pb-8">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Home size={18} />
                Volver al inicio
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
