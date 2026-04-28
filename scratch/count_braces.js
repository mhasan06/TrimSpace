const fs = require('fs');
const content = fs.readFileSync('c:/Users/mohammad.hasan/.antigravity/extensions/barber-app/src/components/BookingFlow_clean.tsx', 'utf8');

let open = 0;
let close = 0;
let lineNum = 0;

const lines = content.split('\n');
for (let line of lines) {
    lineNum++;
    for (let char of line) {
        if (char === '{') open++;
        if (char === '}') close++;
    }
    if (open === close && open > 0) {
        console.log(`Matching found at line ${lineNum}`);
    }
}

console.log(`Total Open: ${open}, Total Close: ${close}`);
