$path = "c:\Users\mohammad.hasan\.antigravity\extensions\barber-app\src\components\BookingFlow.tsx"
$content = [System.IO.File]::ReadAllText($path)

# 1. Add import
$importStr = "import AIConcierge from `"./AIConcierge`";"
if (-not $content.Contains($importStr)) {
    $content = $content.Replace("import { AU_SUBURBS } from `"@/lib/constants`";", "import { AU_SUBURBS } from `"@/lib/constants`";`n$importStr")
}

# 2. Add handleAIResult function and enableAI flag before return
$handler = @"
  const enableAI = process.env.NEXT_PUBLIC_ENABLE_AI_CONCIERGE === 'true';

  const handleAIResult = async (data: any) => {
     if (data.serviceId) {
        const service = initialServices.find((s: any) => s.id === data.serviceId);
        if (service) {
           setMultiCart({ 0: [{ service, quantity: 1 }] });
        }
     }
     if (data.date) {
        setTargetDate(data.date);
        await fetchSlots(data.date);
     }
     if (data.barberId) {
        setSelectedBarberId(data.barberId);
     }
     if (data.time) {
        setSelectedTime(data.time);
     }
     
     if (!data.serviceId) {
        setStage("SERVICES");
     } else if (!data.date || !data.time) {
        setStage("CALENDAR");
     } else if (!data.barberId) {
        setStage("BARBERS");
     } else {
        setStage("PAYMENT");
     }
  };

  return (
"@
if (-not $content.Contains("const handleAIResult")) {
    $content = $content.Replace("  return (", $handler)
}

# 3. Add AIConcierge component above Visual Progress Steps
$aiUI = @"
       {enableAI && <AIConcierge tenantSlug={tenantSlug} onAIResult={handleAIResult} />}
       {/* Visual Progress Steps */}
"@
if (-not $content.Contains("<AIConcierge")) {
    $content = $content.Replace("       {/* Visual Progress Steps */}", $aiUI)
}

[System.IO.File]::WriteAllText($path, $content)
