
/**
 * aiService.ts
 * Maneja la integración con la API de Gemini para transcripción de audio.
 */

const MODEL_NAME = "gemini-2.0-flash";

export const aiService = {
    /**
     * Transcribe un audio en formato Base64 utilizando Gemini.
     */
    transcribeAudio: async (base64Audio: string): Promise<string> => {
        const key = process.env.GEMINI_API_KEY;

        if (!key) {
            console.error("GEMINI_API_KEY no encontrada.");
            throw new Error("API_KEY no configurada");
        }

        const base64Data = base64Audio.split(',')[1] || base64Audio;
        console.log(`Intentando transcripción con ${MODEL_NAME}...`);

        const payload = {
            contents: [{
                parts: [
                    { text: "Transcribe literalmente el audio. Responde solo con el texto." },
                    {
                        inline_data: {
                            mime_type: "audio/webm",
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.1,
            }
        };

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${key}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Error detallado devuelto por Gemini:", errorData);
                throw new Error(`API Error ${response.status}: ${errorData?.error?.message || response.statusText}`);
            }

            const result = await response.json();
            const transcription = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!transcription) {
                throw new Error("El modelo no devolvió ninguna transcripción.");
            }

            return transcription.trim();
        } catch (error: any) {
            console.error("Error en transcribeAudio:", error);
            throw error;
        }
    }
};
