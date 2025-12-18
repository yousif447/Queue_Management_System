const fetch = global.fetch || require('node-fetch');

/**
 * Gemini AI Service for Queue Prediction
 * Uses Google's Generative AI to analyze queue patterns and predict ETA.
 */

exports.predictQueueETA = async (context) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY is missing. Falling back to mathematical calculation.");
            return null;
        }

        const {
            businessType,
            serviceType,
            waitingCount,
            recentDurations,
            hour,
            dayOfWeek,
            currentQueueCount
        } = context;

        // Construct a data-rich prompt
        const prompt = `
        You are an expert Queue Management AI. Your task is to predict the Estimated Wait Time (ETA) for a new customer joining the queue.
        
        CONTEXT DATA:
        - Service Type: ${serviceType}
        - Current Time: ${hour}:00
        - Day: ${dayOfWeek} (0=Sun, 6=Sat)
        - People Waiting Ahead: ${waitingCount}
        
        RECENT PERFORMANCE (Last ${recentDurations.length} tickets duration in minutes):
        ${JSON.stringify(recentDurations)}
        
        ANALYSIS REQUIRED:
        1. Identify the recent trend (is the service speeding up or slowing down?).
        2. Account for the number of people waiting.
        3. Estimate the total wait time for the new customer.
        
        OUTPUT FORMAT:
        Return ONLY a raw JSON object (no markdown, no blocks) with the following structure:
        {
            "estimatedMinutes": <number>,
            "confidence": "high" | "medium" | "low",
            "reasoning": "<short explanation>"
        }
        `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.2, // Low temperature for consistent numerical output
                        maxOutputTokens: 100
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Gemini API Error:", error);
            return null;
        }

        const data = await response.json();
        
        // Parse the response
        try {
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) return null;

            // Clean up markdown if present (```json ... ```)
            const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(jsonStr);
            
            return result;
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", parseError);
            return null;
        }

    } catch (error) {
        console.error("Gemini Service Exception:", error);
        return null;
    }
};
