
const fs = require('fs');
const content = fs.readFileSync('src/components/BookingFlow.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let matches = line.match(/<(div|\/div)/g);
  if (matches) {
    for (let m of matches) {
      if (m === '<div') {
        stack.push(i + 1);
      } else {
        if (stack.length === 0) {
          console.log('Error: Extra </div> at line ' + (i + 1));
        } else {
          stack.pop();
        }
      }
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed <div> starts at lines: ' + stack.join(', '));
}
