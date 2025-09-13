class GeminiService {
    constructor(openai) {
        this.model = openai;
    }

    async generateResponse(prompt) {
        try {
            const response = await this.model.chat.completions.create({
                model: 'gemini-2.5-flash',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0.2
            });
            return response.choices[0].message.content;
        } catch (error) {
            throw new Error(`Gemini API call failed: ${error.message}`);
        }
    }
}

module.exports = GeminiService;