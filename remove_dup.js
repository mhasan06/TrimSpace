const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/BookingFlow.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetRegex = /\/\/ STATE PERSISTENCE: Save\/Restore[\s\S]*?localStorage\.setItem\(`trim_booking_\$\{tenantSlug\}`[\s\S]*?\};\n/;

if (content.match(targetRegex)) {
    content = content.replace(targetRegex, '');
    fs.writeFileSync(filePath, content);
    console.log("Success");
} else {
    console.log("Target not found");
}
