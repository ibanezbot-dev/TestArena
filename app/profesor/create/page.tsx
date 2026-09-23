'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Settings, Eye, Rocket, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CSVUploader from '@/components/csv-uploader';
import { Question } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { generatePin } from '@/lib/scoring';

export default function CreatePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examName, setExamName] = useState('');
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [numQuestions, setNumQuestions] = useState(10);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateExam = async () => {
    if (!examName.trim()) {
      setError('Ingresa un nombre para el examen');
      return;
    }
    if (questions.length === 0) {
      setError('Sube un archivo CSV con preguntas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const pin = generatePin();
      const actualNumQuestions = Math.min(numQuestions, questions.length);

      // Create exam
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          name: examName.trim(),
          pin,
          time_per_question: timePerQuestion,
          num_questions: actualNumQuestions,
        })
        .select()
        .single();

      if (examError || !exam) {
        throw new Error('Error al crear el examen');
      }

      // Select random questions if needed
      let selectedQuestions = questions;
      if (questions.length > actualNumQuestions) {
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        selectedQuestions = shuffled.slice(0, actualNumQuestions);
      }

      // Insert questions
      const questionsToInsert = selectedQuestions.map((q, i) => ({
        exam_id: exam.id,
        order_num: i,
        tema: q.tema,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
      }));

      const { error: qError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (qError) {
        throw new Error('Error al guardar las preguntas');
      }

      // Store as host
      sessionStorage.setItem('is_host', 'true');
      sessionStorage.setItem('exam_id', exam.id);

      // Navigate to lobby
      router.push(`/profesor/${pin}/lobby`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const topicCounts = questions.reduce((acc, q) => {
    acc[q.tema] = (acc[q.tema] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Crear Examen</h1>
            <p className="text-gray-400">Sube tu CSV y configura el examen</p>
          </div>

          {/* CSV Upload */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">1. Subir Preguntas</h2>
            <CSVUploader onQuestionsLoaded={setQuestions} />
          </div>

          {/* Topics summary */}
          {questions.length > 0 && Object.keys(topicCounts).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-3">Temas encontrados</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(topicCounts).map(([tema, count]) => (
                  <span
                    key={tema}
                    className="bg-purple-400/10 text-purple-300 border border-purple-400/30 px-3 py-1 rounded-full text-sm"
                  >
                    {tema} ({count})
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Configuration */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings size={20} className="text-purple-400" />
              2. Configuración
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre del Examen</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="Ej: Examen Final POO"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Tiempo por pregunta (seg)
                  </label>
                  <input
                    type="number"
                    value={timePerQuestion}
                    onChange={(e) => setTimePerQuestion(Math.max(5, parseInt(e.target.value) || 30))}
                    min={5}
                    max={120}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Número de preguntas
                  </label>
                  <input
                    type="number"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 10))}
                    min={1}
                    max={questions.length || 100}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  {questions.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo: {questions.length} disponibles
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview button */}
          {questions.length > 0 && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <Eye size={16} />
              {showPreview ? 'Ocultar' : 'Ver'} preview de preguntas
            </button>
          )}

          {/* Preview table */}
          {showPreview && questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 overflow-x-auto"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Tema</th>
                    <th className="text-left py-2 px-2">Pregunta</th>
                    <th className="text-left py-2 px-2">Resp.</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.slice(0, 20).map((q, i) => (
                    <tr key={i} className="border-b border-gray-700/50">
                      <td className="py-2 px-2 text-gray-500">{i + 1}</td>
                      <td className="py-2 px-2">
                        <span className="text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded text-xs">
                          {q.tema}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-white max-w-xs truncate">{q.question_text}</td>
                      <td className="py-2 px-2 text-green-400 font-mono">{q.correct_answer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {questions.length > 20 && (
                <p className="text-gray-500 text-xs mt-2 text-center">
                  Mostrando 20 de {questions.length} preguntas
                </p>
              )}
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3"
            >
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Create button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateExam}
            disabled={loading || questions.length === 0 || !examName.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-4 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Rocket size={24} />
                Crear Sala de Examen
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
