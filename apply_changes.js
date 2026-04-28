const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/BookingFlow.tsx');
const handlersPath = path.join(process.cwd(), 'scratch/handlers.tsx');
const paymentUIPath = path.join(process.cwd(), 'scratch/payment_ui.tsx');

let content = fs.readFileSync(filePath, 'utf8');
const handlers = fs.readFileSync(handlersPath, 'utf8');
const paymentUI = fs.readFileSync(paymentUIPath, 'utf8');

// 1. Replace Handlers
const handlersRegex = /const handleInPlaceLogin = async \(e: React\.FormEvent\) => \{[\s\S]*?\};/;
if (content.match(handlersRegex)) {
    content = content.replace(handlersRegex, handlers);
} else {
    console.log("Handlers target not found");
}

// 2. Replace PAYMENT UI
const paymentStartMarker = '{stage === "PAYMENT" && (';
const startIdx = content.indexOf(paymentStartMarker);

if (startIdx !== -1) {
    // Find the next persistent mini-cart marker
    const miniCartMarker = '{/* Persistent Mini-Cart (Fresha Style) */}';
    const nextMarkerIdx = content.indexOf(miniCartMarker, startIdx);
    
    if (nextMarkerIdx !== -1) {
        // We need to find the closing bracket of the PAYMENT block before the mini-cart
        const beforeMiniCart = content.substring(0, nextMarkerIdx);
        const lastClosingIdx = beforeMiniCart.lastIndexOf(')}');
        
        if (lastClosingIdx !== -1 && lastClosingIdx > startIdx) {
            content = content.substring(0, startIdx) + paymentUI + '\n\n      ' + content.substring(nextMarkerIdx);
            console.log("Payment UI replaced");
        } else {
            console.log("Could not find closing bracket for Payment UI");
        }
    } else {
        console.log("Mini-cart marker not found");
    }
} else {
    console.log("Payment UI start marker not found");
}

fs.writeFileSync(filePath, content);
console.log("Done");
