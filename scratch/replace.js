import fs from 'fs';

const filePath = 'src/components/BookingFlow.tsx';
const replacementPath = 'scratch/replacement.tsx';

let content = fs.readFileSync(filePath, 'utf-8');
const replacement = fs.readFileSync(replacementPath, 'utf-8');

const startIdx = content.indexOf('      {stage === "BARBERS" && (');
const endIdx = content.indexOf('      {stage === "PAYMENT" && (');

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find start or end index.");
  process.exit(1);
}

// Find the precise end of the block before PAYMENT
const beforePaymentStr = content.substring(0, endIdx);
const lastClosingBracketIdx = beforePaymentStr.lastIndexOf('      )}');

if (lastClosingBracketIdx === -1) {
    console.log("Could not find closing bracket before PAYMENT.");
    process.exit(1);
}

const finalEndIdx = lastClosingBracketIdx + '      )}'.length;

const newContent = content.substring(0, startIdx) + replacement + '\n\n' + content.substring(endIdx);

fs.writeFileSync(filePath, newContent);
console.log("Successfully replaced content.");
