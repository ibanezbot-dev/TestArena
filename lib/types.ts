export interface Question {
  id?: string;
  exam_id?: string;
  order_num: number;
  tema: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
}

export interface Exam {
  id: string;
  name: string;
  pin: string;
  status: 'waiting' | 'active' | 'showing_results' | 'finished';
  current_question: number;
  time_per_question: number;
  num_questions: number;
  created_at: string;
}

export interface Participant {
  id: string;
  exam_id: string;
  name: string;
  score: number;
  answers_correct: number;
  answers_total: number;
  joined_at: string;
}

export interface Answer {
  id?: string;
  participant_id: string;
  question_id: string;
  exam_id: string;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  time_taken_ms: number;
  points_earned: number;
  created_at?: string;
}

export interface CSVRow {
  ID: string;
  Tema: string;
  Pregunta: string;
  Opcion_A: string;
  Opcion_B: string;
  Opcion_C: string;
  Opcion_D: string;
  Respuesta_Correcta: string;
}

export interface TopicAnalytics {
  tema: string;
  total_questions: number;
  total_answers: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_percentage: number;
}

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  tema: string;
  total_answers: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_percentage: number;
  option_a_count: number;
  option_b_count: number;
  option_c_count: number;
  option_d_count: number;
  correct_answer: string;
  avg_time_ms: number;
}

export type BroadcastPayload =
  | { type: 'START_EXAM' }
  | { type: 'NEXT_QUESTION'; questionIndex: number }
  | { type: 'SHOW_RESULTS'; questionIndex: number }
  | { type: 'FINISH_EXAM' }
  | { type: 'TIMER_SYNC'; timeLeft: number };
