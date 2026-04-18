export const AppConfig = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    apiBaseUrl: '/api/v1'
};

export const AuthConfig = {
    tokenExpiry: '1h', // 1 hour in JWT format
    cookieDomain: window.location.hostname,
    cookiePath: '/',
    sessionCookieName: '_ai_session'
};
