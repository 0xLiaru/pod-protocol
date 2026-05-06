import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { videoUrl, dareCategory, dareTitle, userDescription } = await req.json();
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ score: 0, isRelevant: false, report: "SİSTEM HATASI: AI Denetçisi şu an çevrimdışı (API Key Eksik)." });
        }

        // GEMINI 1.5 FLASH: ANALİTİK DENETİM MODU
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `GÖREV: ${dareTitle}
                        KATEGORİ: ${dareCategory}
                        KULLANICI AÇIKLAMASI: ${userDescription}
                        VİDEO LİNKİ: ${videoUrl}

                        SEN BİR "PROOF OF DARE" (POD) PROTOKOLÜ DENETÇİSİSİN.
                        Görevin, kullanıcının gönderdiği videonun ve açıklamanın, yukarıdaki "GÖREV" ile ne kadar uyumlu olduğunu analiz etmektir.

                        ANALİZ KRİTERLERİ:
                        1. İÇERİK UYUMU: Videonun konusu ve kullanıcının açıklaması, görevin başlığı ve kategorisiyle mantıksal olarak örtüşüyor mu?
                        2. KANIT GÜCÜ: Video linki (YouTube/X) geçerli mi? Kullanıcı görevi gerçekten yerine getirmiş mi yoksa alakasız bir video mu paylaşmış?
                        3. SAHTECİLİK KONTROLÜ: Eğer video tamamen alakasızsa (Örn: Spor görevi için yemek videosu), direkt düşük puan ver.

                        PUANLAMA:
                        - 0-30: Tamamen alakasız veya sahte.
                        - 31-76: Kısmen alakalı ama tam kanıt sayılamaz.
                        - 77-100: Başarılı ve ikna edici kanıt.

                        YANIT FORMATI (SADECE JSON):
                        {"score": 0-100, "report": "Kısa ve öz analiz raporu", "isRelevant": true/false}`
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
                    aiSignature: "POD_GUARD_VERIFIED_" + Math.random().toString(36).substring(7)
                });
            }
        }

        throw new Error("AI Analiz sırasında bir tutarsızlık yaşadı.");

    } catch (error: any) {
        return NextResponse.json({ 
            score: 0, 
            isRelevant: false, 
            analysisReport: `DENETİM BAŞARISIZ: ${error.message || "AI şu an bu videoyu analiz edemiyor."}` 
        });
    }
}
