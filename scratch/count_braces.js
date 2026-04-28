
const fs = require('fs');
const content = fs.readFileSync('src/components/BookingFlow.tsx', 'utf8');

function count(char) {
  const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (content.match(new RegExp(escaped, 'g')) || []).length;
}

console.log(' { :', count('{'));
console.log(' } :', count('}'));
console.log(' ( :', count('('));
console.log(' ) :', count(')'));
console.log(' <div :', (content.match(/<div/g) || []).length);
console.log(' </div :', (content.match(/<\/div/g) || []).length);
