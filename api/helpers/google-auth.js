/**
 * Helper to verify Google OAuth ID tokens via Google's tokeninfo endpoint.
 */
export class GoogleAuthHelper {
    /**
     * Verifies a Google ID Token.
     *
     * @param {string} idToken Google ID Token.
     * @returns {Promise<{ email: string, name: string, picture: string, sub: string }>} Token payload data.
     */
    static async verifyToken(idToken) {
        if (!idToken || typeof idToken !== 'string') {
            throw new Error('Missing or invalid ID Token');
        }

        const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google ID Token verification failed: ${errorText}`);
        }

        const payload = await response.json();

        if (!payload.email) {
            throw new Error('Google ID Token did not yield an email');
        }

        if (payload.email_verified === 'false' || payload.email_verified === false) {
            throw new Error('Google email is not verified');
        }

        const expectedClientId = process.env.GOOGLE_CLIENT_ID;
        if (expectedClientId && payload.aud !== expectedClientId) {
            throw new Error('Google ID Token audience mismatch');
        }

        return {
            email: payload.email.toLowerCase().trim(),
            name: payload.name || payload.given_name || payload.email.split('@')[0],
            picture: payload.picture || '',
            sub: payload.sub,
        };
    }
}
