export const AuthService = {
    login(email, password) {
        return fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    },

    logout() {
        return fetch('/api/v1/auth/logout', { method: 'POST' });
    },

    me() {
        return fetch('/api/v1/auth/me');
    },

    setSession(token) {
        localStorage.setItem('authToken', token);
    },

    clearSession() {
        localStorage.removeItem('authToken');
        document.cookie = `${AppConfig.sessionCookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    }
};
