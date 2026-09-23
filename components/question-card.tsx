'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  tema: string;
  options: { label: string; text: string }[];
  onAnswer: (answer: string) => void;
  disabled: boolean;
  selectedAnswer: string | null;
  correctAnswer: string | null; // null while question is active
}

const OPTION_COLORS = [
  { bg: 'bg-red-500', hover: 'hover:bg-red-400', selected: 'ring-red-300', dark: 'bg-red-600' },
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-400', selected: 'ring-blue-300', dark: 'bg-blue-600' },
  { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-400', selected: 'ring-yellow-300', dark: 'bg-yellow-600' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-400', selected: 'ring-green-300', dark: 'bg-green-600' },
];

const OPTION_SHAPES = ['▲', '◆', '●', '■'];

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  questionText,
  tema,
  options,
  onAnswer,
  disabled,
  selectedAnswer,
  correctAnswer,
}: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Question header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-sm text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">
            {tema}
          </span>
          <span className="text-sm text-gray-500">
            {questionNumber} / {totalQuestions}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
          {questionText}
        </h2>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, index) => {
          const colors = OPTION_COLORS[index];
          const isSelected = selectedAnswer === option.label;
          const isCorrectOption = correctAnswer === option.label;
          const showResult = correctAnswer !== null;

          let optionClasses = `${colors.bg} ${!disabled ? colors.hover : ''}`;

          if (showResult) {
            if (isCorrectOption) {
              optionClasses = 'bg-green-500 ring-4 ring-green-300';
            } else if (isSelected && !isCorrectOption) {
              optionClasses = 'bg-red-700 opacity-70';
            } else {
              optionClasses = `${colors.dark} opacity-40`;
            }
          } else if (isSelected) {
            optionClasses = `${colors.bg} ring-4 ${colors.selected} scale-[1.02]`;
          }

          return (
            <motion.button
              key={option.label}
              whileHover={!disabled ? { scale: 1.03 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              onClick={() => !disabled && onAnswer(option.label)}
              disabled={disabled}
              className={`relative p-6 rounded-2xl text-white font-semibold text-lg text-left transition-all duration-200 ${optionClasses} ${disabled && !showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl opacity-60">{OPTION_SHAPES[index]}</span>
                <span className="flex-1">{option.text}</span>
                {showResult && isCorrectOption && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-2xl"
                  >
                    ✓
                  </motion.span>
                )}
                {showResult && isSelected && !isCorrectOption && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-2xl"
                  >
                    ✗
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
