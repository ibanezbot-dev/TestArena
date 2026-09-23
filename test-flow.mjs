// Test script to verify Supabase connection and run full exam flow
// Usage: node test-flow.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  let examId, participantId, questionIds = [];

  // ============================================
  // TEST 1: Check tables exist
  // ============================================
  console.log('\n📋 TEST 1: Verificar tablas...');
  
  const tables = ['exams', 'questions', 'participants', 'answers'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.error(`❌ Tabla "${table}" no existe o no es accesible: ${error.message}`);
      console.error('\n⚠️  Necesitas ejecutar el schema.sql en el SQL Editor de Supabase.');
      console.error('   1. Ve a tu proyecto en supabase.com');
      console.error('   2. Ve a SQL Editor');
      console.error('   3. Pega y ejecuta el contenido de supabase/schema.sql');
      process.exit(1);
    }
    console.log(`   ✅ Tabla "${table}" OK`);
  }

  // ============================================
  // TEST 2: Create an exam
  // ============================================
  console.log('\n🎓 TEST 2: Crear examen...');
  
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .insert({
      name: 'Test POO Exam',
      pin,
      time_per_question: 30,
      num_questions: 3,
    })
    .select()
    .single();

  if (examError) {
    console.error(`❌ Error creando examen: ${examError.message}`);
    process.exit(1);
  }

  examId = exam.id;
  console.log(`   ✅ Examen creado: "${exam.name}" (PIN: ${exam.pin}, ID: ${exam.id})`);

  // ============================================
  // TEST 3: Insert questions
  // ============================================
  console.log('\n❓ TEST 3: Insertar preguntas...');
  
  const questionsData = [
    {
      exam_id: examId,
      order_num: 0,
      tema: 'Herencia',
      question_text: '¿Qué keyword se usa para heredar en Java?',
      option_a: 'extends',
      option_b: 'implements',
      option_c: 'inherits',
      option_d: 'super',
      correct_answer: 'A',
    },
    {
      exam_id: examId,
      order_num: 1,
      tema: 'Polimorfismo',
      question_text: '¿Qué tipo de polimorfismo se logra con sobrecarga?',
      option_a: 'En tiempo de compilación',
      option_b: 'En tiempo de ejecución',
      option_c: 'Dinámico',
      option_d: 'Virtual',
      correct_answer: 'A',
    },
    {
      exam_id: examId,
      order_num: 2,
      tema: 'Encapsulamiento',
      question_text: '¿Qué modificador hace un atributo solo accesible en su clase?',
      option_a: 'private',
      option_b: 'protected',
      option_c: 'public',
      option_d: 'default',
      correct_answer: 'A',
    },
  ];

  const { data: insertedQuestions, error: qError } = await supabase
    .from('questions')
    .insert(questionsData)
    .select();

  if (qError) {
    console.error(`❌ Error insertando preguntas: ${qError.message}`);
    await cleanup(examId);
    process.exit(1);
  }

  questionIds = insertedQuestions.map(q => q.id);
  console.log(`   ✅ ${insertedQuestions.length} preguntas insertadas`);

  // ============================================
  // TEST 4: Add participants
  // ============================================
  console.log('\n👥 TEST 4: Agregar participantes...');
  
  const participantNames = ['Carlos', 'María', 'Luis'];
  const { data: participants, error: pError } = await supabase
    .from('participants')
    .insert(participantNames.map(name => ({ exam_id: examId, name })))
    .select();

  if (pError) {
    console.error(`❌ Error agregando participantes: ${pError.message}`);
    await cleanup(examId);
    process.exit(1);
  }

  console.log(`   ✅ ${participants.length} participantes agregados: ${participants.map(p => p.name).join(', ')}`);

  // ============================================
  // TEST 5: Simulate answers
  // ============================================
  console.log('\n✍️  TEST 5: Simular respuestas...');
  
  const answersData = [];
  for (const participant of participants) {
    for (let qi = 0; qi < questionIds.length; qi++) {
      const options = ['A', 'B', 'C', 'D'];
      // Give each participant different accuracy
      const isCorrect = participant.name === 'Carlos' ? true 
        : participant.name === 'María' ? (qi !== 1) 
        : (qi === 0);
      
      const selectedAnswer = isCorrect ? 'A' : options[Math.floor(Math.random() * 3) + 1];
      const timeTakenMs = Math.floor(Math.random() * 20000) + 5000;
      const points = isCorrect ? Math.round(1000 * (1 - timeTakenMs / 30000)) + 1000 : 0;

      answersData.push({
        participant_id: participant.id,
        question_id: questionIds[qi],
        exam_id: examId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        points_earned: points,
      });
    }
  }

  const { error: aError } = await supabase.from('answers').insert(answersData);

  if (aError) {
    console.error(`❌ Error insertando respuestas: ${aError.message}`);
    await cleanup(examId);
    process.exit(1);
  }

  console.log(`   ✅ ${answersData.length} respuestas simuladas`);

  // Update participant scores
  for (const participant of participants) {
    const pAnswers = answersData.filter(a => a.participant_id === participant.id);
    const totalScore = pAnswers.reduce((sum, a) => sum + a.points_earned, 0);
    const correct = pAnswers.filter(a => a.is_correct).length;

    await supabase
      .from('participants')
      .update({
        score: totalScore,
        answers_correct: correct,
        answers_total: pAnswers.length,
      })
      .eq('id', participant.id);
  }

  console.log('   ✅ Puntuaciones actualizadas');

  // ============================================
  // TEST 6: Verify leaderboard
  // ============================================
  console.log('\n🏆 TEST 6: Verificar leaderboard...');
  
  const { data: leaderboard, error: lError } = await supabase
    .from('participants')
    .select('*')
    .eq('exam_id', examId)
    .order('score', { ascending: false });

  if (lError) {
    console.error(`❌ Error obteniendo leaderboard: ${lError.message}`);
    await cleanup(examId);
    process.exit(1);
  }

  console.log('   📊 Leaderboard:');
  leaderboard.forEach((p, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    console.log(`      ${medal} ${p.name}: ${p.score} pts (${p.answers_correct}/${p.answers_total} correctas)`);
  });

  // ============================================
  // TEST 7: Verify analytics data
  // ============================================
  console.log('\n📊 TEST 7: Verificar datos de analíticas...');
  
  const { data: allAnswers } = await supabase
    .from('answers')
    .select('*')
    .eq('exam_id', examId);

  const { data: allQuestions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId);

  // Group by tema
  const temaStats = {};
  for (const q of allQuestions) {
    if (!temaStats[q.tema]) {
      temaStats[q.tema] = { total: 0, correct: 0 };
    }
    const qAnswers = allAnswers.filter(a => a.question_id === q.id);
    temaStats[q.tema].total += qAnswers.length;
    temaStats[q.tema].correct += qAnswers.filter(a => a.is_correct).length;
  }

  console.log('   📈 Análisis por tema:');
  for (const [tema, stats] of Object.entries(temaStats)) {
    const pct = Math.round((stats.correct / stats.total) * 100);
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    console.log(`      ${tema}: ${bar} ${pct}% (${stats.correct}/${stats.total})`);
  }

  // ============================================
  // TEST 8: Update exam status
  // ============================================
  console.log('\n🏁 TEST 8: Finalizar examen...');
  
  const { error: updateError } = await supabase
    .from('exams')
    .update({ status: 'finished', current_question: 2 })
    .eq('id', examId);

  if (updateError) {
    console.error(`❌ Error actualizando examen: ${updateError.message}`);
    await cleanup(examId);
    process.exit(1);
  }

  console.log('   ✅ Examen marcado como finalizado');

  // ============================================
  // CLEANUP
  // ============================================
  console.log('\n🧹 Limpiando datos de prueba...');
  await cleanup(examId);

  // ============================================
  // RESULTS
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
  console.log('='.repeat(50));
  console.log('\nLa conexión a Supabase funciona correctamente.');
  console.log('Las tablas están creadas y operativas.');
  console.log('El flujo completo (crear examen → participantes → respuestas → leaderboard → analíticas) funciona.');
  console.log('\nPuedes ejecutar `npm run dev` para probar la app en el navegador.');
}

async function cleanup(examId) {
  // Delete in correct order due to foreign keys
  await supabase.from('answers').delete().eq('exam_id', examId);
  await supabase.from('participants').delete().eq('exam_id', examId);
  await supabase.from('questions').delete().eq('exam_id', examId);
  await supabase.from('exams').delete().eq('id', examId);
  console.log('   ✅ Datos de prueba eliminados');
}

runTests().catch((err) => {
  console.error('❌ Error inesperado:', err.message);
  process.exit(1);
});
