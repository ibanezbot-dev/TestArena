import Papa from 'papaparse';
import { CSVRow, Question } from './types';

export function parseCSV(file: File): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`Error al parsear CSV: ${results.errors[0].message}`));
          return;
        }

        const questions: Question[] = results.data.map((row, index) => {
          const correctAnswer = row.Respuesta_Correcta?.trim().toUpperCase();
          
          if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
            throw new Error(
              `Fila ${index + 1}: Respuesta_Correcta debe ser A, B, C o D. Se encontró: "${row.Respuesta_Correcta}"`
            );
          }

          return {
            order_num: index,
            tema: row.Tema?.trim() || 'General',
            question_text: row.Pregunta?.trim() || '',
            option_a: row.Opcion_A?.trim() || '',
            option_b: row.Opcion_B?.trim() || '',
            option_c: row.Opcion_C?.trim() || '',
            option_d: row.Opcion_D?.trim() || '',
            correct_answer: correctAnswer as 'A' | 'B' | 'C' | 'D',
          };
        });

        // Validate that all questions have required fields
        const invalidQuestions = questions.filter(
          (q) => !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d
        );

        if (invalidQuestions.length > 0) {
          reject(
            new Error(
              `${invalidQuestions.length} pregunta(s) tienen campos vacíos. Revisa el CSV.`
            )
          );
          return;
        }

        resolve(questions);
      },
      error: (error: Error) => {
        reject(new Error(`Error al leer el archivo: ${error.message}`));
      },
    });
  });
}

export function validateCSVHeaders(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (results) => {
        const requiredHeaders = [
          'Pregunta',
          'Opcion_A',
          'Opcion_B',
          'Opcion_C',
          'Opcion_D',
          'Respuesta_Correcta',
        ];
        
        const headers = results.meta.fields || [];
        const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

        if (missingHeaders.length > 0) {
          reject(
            new Error(
              `Faltan columnas en el CSV: ${missingHeaders.join(', ')}. Columnas encontradas: ${headers.join(', ')}`
            )
          );
          return;
        }

        resolve(true);
      },
      error: (error: Error) => {
        reject(new Error(`Error al validar headers: ${error.message}`));
      },
    });
  });
}
