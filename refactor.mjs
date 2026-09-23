import { readFileSync, writeFileSync } from 'fs';

function replaceInFile(path, regexOrString, replacement) {
  let content = readFileSync(path, 'utf-8');
  content = content.replace(regexOrString, replacement);
  writeFileSync(path, content);
}

console.log('1. Home page links');
replaceInFile('app/page.tsx', /href="\/create"/g, 'href="/profesor/create"');
replaceInFile('app/page.tsx', /href="\/join"/g, 'href="/alumno/join"');

console.log('2. Create page redirect');
replaceInFile('app/profesor/create/page.tsx', /\/exam\/\$\{data\.pin\}\/lobby/g, '/profesor/${data.pin}/lobby');

console.log('3. Join page redirect');
replaceInFile('app/alumno/join/page.tsx', /\/exam\/\$\{pin\}\/lobby/g, '/alumno/${pin}/lobby');

console.log('4. Lobby page (Profesor)');
replaceInFile('app/profesor/[pin]/lobby/page.tsx', /\/exam\/\$\{pin\}\/play/g, '/profesor/${pin}/play');
// Remove student view waiting message: {!isHost && (...)}
replaceInFile('app/profesor/[pin]/lobby/page.tsx', /\{\/\* Student waiting message \*\/\}[\s\S]*?\{!isHost && \([\s\S]*?<\/div>\s*\)\}/, '');
// For Host, isHost is always true. We can leave the `isHost &&` logic, it evaluates correctly since it reads from session. But wait, `isHost` state will be true anyway. Let's just leave the state logic for now.

console.log('5. Lobby page (Alumno)');
replaceInFile('app/alumno/[pin]/lobby/page.tsx', /\/exam\/\$\{pin\}\/play/g, '/alumno/${pin}/play');
// Remove host start button: {isHost && (...)}
replaceInFile('app/alumno/[pin]/lobby/page.tsx', /\{\/\* Start button \(host only\) \*\/\}[\s\S]*?\{isHost && \([\s\S]*?<\/motion\.button>\s*\)\}/, '');
// Remove exam config summary
replaceInFile('app/alumno/[pin]/lobby/page.tsx', /\{\/\* Exam config summary \*\/\}[\s\S]*?\{\/\* Participants \*\/\}/, '{/* Participants */}');

console.log('6. Play page (Profesor)');
replaceInFile('app/profesor/[pin]/play/page.tsx', /\/exam\/\$\{pin\}\/results/g, '/profesor/${pin}/results');
// Remove points feedback for student
replaceInFile('app/profesor/[pin]/play/page.tsx', /\{\/\* Points earned \*\/\}[\s\S]*?\{!isHost && \([\s\S]*?<\/motion\.div>\s*\)\}/, '');
// Disable answering
replaceInFile('app/profesor/[pin]/play/page.tsx', /onAnswer=\{isHost \? \(\) => \{\} : handleAnswer\}/, 'onAnswer={() => {}}');
replaceInFile('app/profesor/[pin]/play/page.tsx', /\{\/\* Points feedback \*\/\}[\s\S]*?\{selectedAnswer && !showCorrectAnswer && \([\s\S]*?<\/motion\.div>\s*\)\}/, '');

console.log('7. Play page (Alumno)');
replaceInFile('app/alumno/[pin]/play/page.tsx', /\/exam\/\$\{pin\}\/results/g, '/alumno/${pin}/results');
// Remove next button
replaceInFile('app/alumno/[pin]/play/page.tsx', /\{\/\* Next button \(host only\) \*\/\}[\s\S]*?\{isHost && \([\s\S]*?<\/motion\.button>\s*\)\}/, '');
// Enable answering
replaceInFile('app/alumno/[pin]/play/page.tsx', /onAnswer=\{isHost \? \(\) => \{\} : handleAnswer\}/, 'onAnswer={handleAnswer}');
// Remove answeredCount label on top
replaceInFile('app/alumno/[pin]/play/page.tsx', /\{isHost && phase === 'question' && \([\s\S]*?<\/div>\s*\)\}/, '');

console.log('8. Results page (Profesor)');
// Keep everything

console.log('9. Results page (Alumno)');
replaceInFile('app/alumno/[pin]/results/page.tsx', /\{\/\* Analytics toggle \*\/\}[\s\S]*?\{isHost && \([\s\S]*?<\/div>\s*\)\}/, '');
replaceInFile('app/alumno/[pin]/results/page.tsx', /\{\/\* Analytics \*\/\}[\s\S]*?\{showAnalytics && isHost && \([\s\S]*?<\/motion\.div>\s*\)\}/, '');

console.log('Done refactoring');
