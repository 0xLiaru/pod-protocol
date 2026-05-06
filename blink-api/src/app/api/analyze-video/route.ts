import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { videoUrl, dareCategory, dareTitle, userDescription } = await req.json();
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ score: 0, isRelevant: false, report: "SİSTEM HATASI: API KEY EKSİK." });
        }

        // GEMINI 1.5 FLASH: HIZLI VE KESİN DENETİM
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `SEN BİR DAREGUARD DENETÇİSİSİN.
                        GÖREV: ${dareTitle}
                        AÇIKLAMA: ${userDescription}
                        LİNK: ${videoUrl}

                        TALİMAT: Videoyu ve açıklamayı analiz et. Eğer içerik görevle %100 alakalı değilse veya video sahteyse direkt 0 puan ver.
                        SADECE BU JSON FORMATINDA YANIT VER:
                        {"score": 0-100, "report": "neden bu puanı verdin", "isRelevant": true/false}`
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]) {
            const rawText = data.candidates[0].content.parts[0].text;
            const jsonMatch = rawText.match(/\{.*\}/s);
            if (jsonMatch) {
                const res = JSON.parse(jsonMatch[0]);
                return NextResponse.json({
                    isRelevant: res.score >= 77,
                    score: res.score,
                    analysisReport: res.report,
                    aiSignature: "DG_VERIFIED_" + Date.now()
                });
            }
        }

        throw new Error("AI Yanıt Vermedi");

    } catch (error) {
        // HATA DURUMUNDA ARTIK ASLA ONAYLAMA YAPMIYORUZ
        return NextResponse.json({ 
            score: 0, 
            isRelevant: false, 
            analysisReport: "KRİTİK HATA: AI videoyu doğrulayamadı. Lütfen linki veya açıklamayı güncelleyip tekrar deneyin." 
        });
    }
}
