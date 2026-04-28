
const fs = require('fs');
const content = fs.readFileSync('src/components/BookingFlow.tsx', 'utf8');

function check(open, close) {
  let stack = [];
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let j = 0; j < line.length; j++) {
      if (line[j] === open) stack.push(i + 1);
      else if (line[j] === close) {
        if (stack.length === 0) console.log(`Extra ${close} at line ${i + 1}`);
        else stack.pop();
      }
    }
  }
  if (stack.length > 0) console.log(`Unclosed ${open} starts at lines: ${stack.join(', ')}`);
}

check('{', '}');
check('(', ')');
