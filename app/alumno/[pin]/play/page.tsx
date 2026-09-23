'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useExamRealtime } from '@/hooks/use-exam-realtime';
import { calculatePoints } from '@/lib/scoring';
import QuestionCard from '@/components/question-card';
import Timer from '@/components/timer';
import Leaderboard from '@/components/leaderboard';
import { Exam, Question, Participant, BroadcastPayload } from '@/lib/types';

type GamePhase = 'loading' | 'question' | 'results' | 'finished';

export default function PlayPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = use(params);
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<(Question & { id: string })[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  const questionStartTimeRef = useRef<number>(Date.now());
  const hasAnsweredRef = useRef(false);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      // Load exam
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('pin', pin)
        .single();

      if (!examData) {
        router.push('/');
        return;
      }

      setExam(examData as Exam);

      const host = sessionStorage.getItem('is_host') === 'true' &&
        sessionStorage.getItem('exam_id') === examData.id;
      setIsHost(host);
      setParticipantId(sessionStorage.getItem('participant_id'));

      // Load questions
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examData.id)
        .order('order_num');

      if (qData) setQuestions(qData as (Question & { id: string })[]);

      // Load participants
      const { data: pData } = await supabase
        .from('participants')
        .select('*')
        .eq('exam_id', examData.id)
        .order('score', { ascending: false });

      if (pData) setParticipants(pData as Participant[]);

      // Start the first question
      setCurrentQuestionIndex(0);
      setPhase('question');
      setIsTimerRunning(true);
      questionStartTimeRef.current = Date.now();
      hasAnsweredRef.current = false;
    };

    loadData();
  }, [pin, router]);

  // Listen for participant score updates
  useEffect(() => {
    if (!exam) return;

    const channel = supabase
      .channel(`play-participants:${exam.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'participants', filter: `exam_id=eq.${exam.id}` },
        (payload) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === (payload.new as Participant).id
                ? (payload.new as Participant)
                : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [exam]);

  // Listen for answer count (for host display)
  useEffect(() => {
    if (!exam || !isHost) return;

    const channel = supabase
      .channel(`answer-count:${exam.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers', filter: `exam_id=eq.${exam.id}` },
        () => {
          setAnsweredCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [exam, isHost]);


  // Handle broadcast messages
  const handleBroadcast = useCallback(
    (payload: BroadcastPayload) => {
      switch (payload.type) {
        case 'NEXT_QUESTION':
          setCurrentQuestionIndex(payload.questionIndex);
          setSelectedAnswer(null);
          setShowCorrectAnswer(false);
          setPointsEarned(0);
          setPhase('question');
          setTimerKey((k) => k + 1);
          setIsTimerRunning(true);
          setAnsweredCount(0);
          questionStartTimeRef.current = Date.now();
          hasAnsweredRef.current = false;
          break;

        case 'SHOW_RESULTS':
          setPhase('results');
          setIsTimerRunning(false);
          setShowCorrectAnswer(true);
          break;

        case 'FINISH_EXAM':
          setPhase('finished');
          setIsTimerRunning(false);
          router.push(`/alumno/${pin}/results`);
          break;
      }
    },
    [pin, router]
  );

  const { broadcast, isConnected } = useExamRealtime({
    pin,
    participantName: isHost ? 'Profesor' : (sessionStorage.getItem('participant_name') || ''),
    onBroadcast: handleBroadcast,
    enabled: !!exam,
  });

  // Handle answer selection (student)
  const handleAnswer = useCallback(
    async (answer: string) => {
      if (hasAnsweredRef.current || !exam || !participantId) return;
      hasAnsweredRef.current = true;
      setSelectedAnswer(answer);

      const currentQ = questions[currentQuestionIndex];
      if (!currentQ) return;

      const timeTakenMs = Date.now() - questionStartTimeRef.current;
      const isCorrect = answer === currentQ.correct_answer;
      const points = calculatePoints(
        isCorrect,
        timeTakenMs,
        exam.time_per_question * 1000
      );

      setPointsEarned(points);

      // Save answer to DB
      await supabase.from('answers').insert({
        participant_id: participantId,
        question_id: currentQ.id,
        exam_id: exam.id,
        selected_answer: answer,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        points_earned: points,
      });

      // Update participant score
      const participant = participants.find((p) => p.id === participantId);
      if (participant) {
        await supabase
          .from('participants')
          .update({
            score: participant.score + points,
            answers_correct: participant.answers_correct + (isCorrect ? 1 : 0),
            answers_total: participant.answers_total + 1,
          })
          .eq('id', participantId);
      }
    },
    [exam, participantId, questions, currentQuestionIndex, participants]
  );

  // Handle time up (host triggers show results)
  const handleTimeUp = useCallback(async () => {
    if (!isHost) return;

    setIsTimerRunning(false);

    // Show results to everyone
    await broadcast({ type: 'SHOW_RESULTS', questionIndex: currentQuestionIndex });
    setPhase('results');
    setShowCorrectAnswer(true);
  }, [isHost, broadcast, currentQuestionIndex]);

  // Auto-skip when everyone has answered
  useEffect(() => {
    if (
      isHost &&
      phase === 'question' &&
      participants.length > 0 &&
      answeredCount >= participants.length
    ) {
      handleTimeUp();
    }
  }, [isHost, phase, participants.length, answeredCount, handleTimeUp]);

  // Handle next question (host only)
  const handleNextQuestion = useCallback(async () => {
    if (!isHost || !exam) return;

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      // Finish exam
      await supabase
        .from('exams')
        .update({ status: 'finished' })
        .eq('id', exam.id);

      await broadcast({ type: 'FINISH_EXAM' });
      router.push(`/alumno/${pin}/results`);
    } else {
      // Update exam
      await supabase
        .from('exams')
        .update({ current_question: nextIndex })
        .eq('id', exam.id);

      await broadcast({ type: 'NEXT_QUESTION', questionIndex: nextIndex });

      // Also update local state for host
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setShowCorrectAnswer(false);
      setPointsEarned(0);
      setPhase('question');
      setTimerKey((k) => k + 1);
      setIsTimerRunning(true);
      setAnsweredCount(0);
      questionStartTimeRef.current = Date.now();
      hasAnsweredRef.current = false;
    }
  }, [isHost, exam, currentQuestionIndex, questions.length, broadcast, pin, router]);

  if (phase === 'loading' || !exam) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-400" size={40} />
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-6 min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl relative z-10 flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-400">
            {exam.name}
          </div>
          
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <AnimatePresence mode="wait">
            {phase === 'question' && currentQuestion && (
              <motion.div
                key={`question-${currentQuestionIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full flex flex-col items-center gap-6"
              >
                {/* Timer */}
                <Timer
                  key={timerKey}
                  totalSeconds={exam.time_per_question}
                  isRunning={isTimerRunning}
                  onTimeUp={handleTimeUp}
                />

                {/* Question */}
                <QuestionCard
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
                  questionText={currentQuestion.question_text}
                  tema={currentQuestion.tema}
                  options={[
                    { label: 'A', text: currentQuestion.option_a },
                    { label: 'B', text: currentQuestion.option_b },
                    { label: 'C', text: currentQuestion.option_c },
                    { label: 'D', text: currentQuestion.option_d },
                  ]}
                  onAnswer={handleAnswer}
                  disabled={isHost || hasAnsweredRef.current}
                  selectedAnswer={selectedAnswer}
                  correctAnswer={showCorrectAnswer ? currentQuestion.correct_answer : null}
                />

                {/* Points feedback */}
                {selectedAnswer && !showCorrectAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-gray-400"
                  >
                    Respuesta registrada. Esperando resultados...
                  </motion.div>
                )}
              </motion.div>
            )}

            {phase === 'results' && currentQuestion && (
              <motion.div
                key={`results-${currentQuestionIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center gap-6"
              >
                {/* Show correct answer */}
                <QuestionCard
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
                  questionText={currentQuestion.question_text}
                  tema={currentQuestion.tema}
                  options={[
                    { label: 'A', text: currentQuestion.option_a },
                    { label: 'B', text: currentQuestion.option_b },
                    { label: 'C', text: currentQuestion.option_c },
                    { label: 'D', text: currentQuestion.option_d },
                  ]}
                  onAnswer={() => {}}
                  disabled={true}
                  selectedAnswer={selectedAnswer}
                  correctAnswer={currentQuestion.correct_answer}
                />

                {/* Points earned */}
                {!isHost && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className={`text-center p-4 rounded-2xl ${
                      pointsEarned > 0
                        ? 'bg-green-400/10 border border-green-400/30'
                        : 'bg-red-400/10 border border-red-400/30'
                    }`}
                  >
                    <p className={`text-3xl font-black ${pointsEarned > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pointsEarned > 0 ? `+${pointsEarned}` : '0'} pts
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {pointsEarned > 0 ? '¡Correcto!' : selectedAnswer ? 'Incorrecto' : 'Sin respuesta'}
                    </p>
                  </motion.div>
                )}

                {/* Mini leaderboard */}
                <div className="w-full max-w-md">
                  <Leaderboard
                    participants={participants}
                    currentParticipantId={participantId || undefined}
                    compact
                  />
                </div>

                
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
