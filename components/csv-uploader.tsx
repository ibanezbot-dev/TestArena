'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { parseCSV, validateCSVHeaders } from '@/lib/csv-parser';
import { Question } from '@/lib/types';

interface CSVUploaderProps {
  onQuestionsLoaded: (questions: Question[]) => void;
}

export default function CSVUploader({ onQuestionsLoaded }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        await validateCSVHeaders(file);
        const questions = await parseCSV(file);
        setFileName(file.name);
        setQuestionCount(questions.length);
        onQuestionsLoaded(questions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setFileName(null);
        setQuestionCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [onQuestionsLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        setError('Por favor sube un archivo .csv');
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleClear = () => {
    setFileName(null);
    setQuestionCount(0);
    setError(null);
    onQuestionsLoaded([]);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {fileName ? (
          <motion.div
            key="loaded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative border-2 border-green-400 bg-green-400/10 rounded-2xl p-6 text-center"
          >
            <button
              onClick={handleClear}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <CheckCircle className="mx-auto mb-3 text-green-400" size={48} />
            <p className="text-green-400 font-semibold text-lg">{fileName}</p>
            <p className="text-gray-400 mt-1">
              {questionCount} preguntas cargadas correctamente
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'border-purple-400 bg-purple-400/10 scale-[1.02]'
                : 'border-gray-600 hover:border-purple-400/50 hover:bg-gray-800/50'
            } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-input')?.click()}
          >
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
            {isLoading ? (
              <div className="animate-spin mx-auto mb-3 w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full" />
            ) : (
              <Upload
                className={`mx-auto mb-3 transition-colors ${
                  isDragging ? 'text-purple-400' : 'text-gray-500'
                }`}
                size={48}
              />
            )}
            <p className="text-gray-300 font-medium">
              {isLoading
                ? 'Procesando archivo...'
                : 'Arrastra tu archivo CSV aquí'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              o haz clic para seleccionar
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-gray-600 text-xs">
              <FileText size={14} />
              <span>Formato: ID, Tema, Pregunta, Opcion_A, Opcion_B, Opcion_C, Opcion_D, Respuesta_Correcta</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3"
          >
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
