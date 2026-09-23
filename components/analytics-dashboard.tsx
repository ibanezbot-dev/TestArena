'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingDown, TrendingUp, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { Question, Answer, TopicAnalytics, QuestionAnalytics } from '@/lib/types';

interface AnalyticsDashboardProps {
  questions: (Question & { id: string })[];
  answers: Answer[];
  participantCount: number;
}

export default function AnalyticsDashboard({
  questions,
  answers,
  participantCount,
}: AnalyticsDashboardProps) {
  const topicAnalytics = useMemo((): TopicAnalytics[] => {
    const topicMap = new Map<string, TopicAnalytics>();

    questions.forEach((q) => {
      const tema = q.tema || 'General';
      if (!topicMap.has(tema)) {
        topicMap.set(tema, {
          tema,
          total_questions: 0,
          total_answers: 0,
          correct_answers: 0,
          incorrect_answers: 0,
          accuracy_percentage: 0,
        });
      }
      const t = topicMap.get(tema)!;
      t.total_questions++;
    });

    answers.forEach((a) => {
      const question = questions.find((q) => q.id === a.question_id);
      if (!question) return;
      const tema = question.tema || 'General';
      const t = topicMap.get(tema);
      if (!t) return;

      t.total_answers++;
      if (a.is_correct) {
        t.correct_answers++;
      } else {
        t.incorrect_answers++;
      }
    });

    topicMap.forEach((t) => {
      t.accuracy_percentage =
        t.total_answers > 0
          ? Math.round((t.correct_answers / t.total_answers) * 100)
          : 0;
    });

    return Array.from(topicMap.values()).sort(
      (a, b) => a.accuracy_percentage - b.accuracy_percentage
    );
  }, [questions, answers]);

  const questionAnalytics = useMemo((): QuestionAnalytics[] => {
    return questions.map((q) => {
      const qAnswers = answers.filter((a) => a.question_id === q.id);
      const correct = qAnswers.filter((a) => a.is_correct).length;
      const incorrect = qAnswers.length - correct;

      return {
        question_id: q.id,
        question_text: q.question_text,
        tema: q.tema,
        total_answers: qAnswers.length,
        correct_answers: correct,
        incorrect_answers: incorrect,
        accuracy_percentage:
          qAnswers.length > 0 ? Math.round((correct / qAnswers.length) * 100) : 0,
        option_a_count: qAnswers.filter((a) => a.selected_answer === 'A').length,
        option_b_count: qAnswers.filter((a) => a.selected_answer === 'B').length,
        option_c_count: qAnswers.filter((a) => a.selected_answer === 'C').length,
        option_d_count: qAnswers.filter((a) => a.selected_answer === 'D').length,
        correct_answer: q.correct_answer,
        avg_time_ms:
          qAnswers.length > 0
            ? Math.round(
                qAnswers.reduce((sum, a) => sum + a.time_taken_ms, 0) / qAnswers.length
              )
            : 0,
      };
    }).sort((a, b) => a.accuracy_percentage - b.accuracy_percentage);
  }, [questions, answers]);

  const overallAccuracy = useMemo(() => {
    if (answers.length === 0) return 0;
    const correct = answers.filter((a) => a.is_correct).length;
    return Math.round((correct / answers.length) * 100);
  }, [answers]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Participantes',
            value: participantCount,
            icon: Target,
            color: 'text-purple-400',
          },
          {
            label: 'Preguntas',
            value: questions.length,
            icon: BarChart3,
            color: 'text-blue-400',
          },
          {
            label: 'Respuestas',
            value: answers.length,
            icon: CheckCircle,
            color: 'text-green-400',
          },
          {
            label: 'Precisión global',
            value: `${overallAccuracy}%`,
            icon: overallAccuracy >= 70 ? TrendingUp : TrendingDown,
            color: overallAccuracy >= 70 ? 'text-green-400' : 'text-red-400',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 text-center"
          >
            <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={24} />
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Topic analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="text-purple-400" size={24} />
          Análisis por Tema
        </h3>

        <div className="space-y-4">
          {topicAnalytics.map((topic, i) => (
            <motion.div
              key={topic.tema}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {topic.accuracy_percentage < 50 ? (
                    <AlertTriangle className="text-red-400" size={16} />
                  ) : topic.accuracy_percentage >= 80 ? (
                    <CheckCircle className="text-green-400" size={16} />
                  ) : (
                    <Target className="text-yellow-400" size={16} />
                  )}
                  <span className="text-white font-medium">{topic.tema}</span>
                  <span className="text-gray-500 text-xs">
                    ({topic.total_questions} preguntas)
                  </span>
                </div>
                <span
                  className={`font-bold ${
                    topic.accuracy_percentage >= 80
                      ? 'text-green-400'
                      : topic.accuracy_percentage >= 50
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {topic.accuracy_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${topic.accuracy_percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                  className={`h-3 rounded-full ${
                    topic.accuracy_percentage >= 80
                      ? 'bg-green-400'
                      : topic.accuracy_percentage >= 50
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>
                  {topic.correct_answers} correctas / {topic.incorrect_answers} incorrectas
                </span>
                <span>{topic.total_answers} respuestas totales</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Questions detail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-400" size={24} />
          Preguntas con Mayor Dificultad
        </h3>

        <div className="space-y-4">
          {questionAnalytics.slice(0, 10).map((q, i) => (
            <motion.div
              key={q.question_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">
                    {q.tema}
                  </span>
                  <p className="text-white mt-1 font-medium">{q.question_text}</p>
                </div>
                <span
                  className={`text-lg font-bold whitespace-nowrap ${
                    q.accuracy_percentage >= 80
                      ? 'text-green-400'
                      : q.accuracy_percentage >= 50
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {q.accuracy_percentage}%
                </span>
              </div>

              {/* Option distribution bars */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'A', count: q.option_a_count },
                  { label: 'B', count: q.option_b_count },
                  { label: 'C', count: q.option_c_count },
                  { label: 'D', count: q.option_d_count },
                ].map((opt) => {
                  const isCorrect = opt.label === q.correct_answer;
                  const pct =
                    q.total_answers > 0
                      ? Math.round((opt.count / q.total_answers) * 100)
                      : 0;

                  return (
                    <div key={opt.label} className="text-center">
                      <div className="text-xs text-gray-400 mb-1">
                        {opt.label}{isCorrect ? ' ✓' : ''}
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                        <div
                          className={`h-2 rounded-full ${isCorrect ? 'bg-green-400' : 'bg-gray-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {opt.count} ({pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-gray-500 mt-2">
                Tiempo promedio: {(q.avg_time_ms / 1000).toFixed(1)}s
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
