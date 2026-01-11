export class LeaderboardManager {
    constructor() {
        this.apiBase = '/api/scores';
    }

    async getScores(mode) {
        try {
            const response = await fetch(`${this.apiBase}/${mode}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching scores:', error);
            return [];
        }
    }

    async submitScore(pseudo, score, mode, accuracy) {
        try {
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pseudo, score, mode, accuracy }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error submitting score:', error);
            return { success: false };
        }
    }
}
