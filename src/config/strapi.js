export const STRAPI_CONFIG = {
    url: import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337',
    apiToken: import.meta.env.VITE_STRAPI_API_TOKEN || '',
    endpoints: {
        orders: '/api/ordens',  // Strapi pluraliza 'orden' como 'ordens'
        orderItems: '/api/orden-items'  // Strapi usa kebab-case
    }
};

export const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(STRAPI_CONFIG.apiToken && {
        Authorization: `Bearer ${STRAPI_CONFIG.apiToken}`
    })
});
