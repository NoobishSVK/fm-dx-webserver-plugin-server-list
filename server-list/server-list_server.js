const router = require('../../server/endpoints');

const SERVERLIST_SERVERS = [
    {
        name: "Local",
        api: "http://127.0.0.1:8080/api",
        redirectUrl: "http://127.0.0.1:8080"
    },
    {
        name: "Local 2",
        api: "http://192.168.1.80:8080/api",
        redirectUrl: "http://192.168.1.80:8080"
    },
];

const fetchWithTimeout = async (url, timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
};

router.get('/server-list/get', async (req, res) => {
    const timeout = 1000; // 1 second timeout
    const results = await Promise.allSettled(
        SERVERLIST_SERVERS.map(async (server) => {
            try {
                const data = await fetchWithTimeout(server.api, timeout);
                return {
                    name: server.name,
                    api: server.api,
                    redirectUrl: server.redirectUrl,
                    signal: data?.sig ?? null,
                    frequency: data?.freq ?? null,
                    rdsPs: data?.ps ?? null
                };
            } catch (err) {
                return {
                    name: server.name,
                    api: server.api,
                    redirectUrl: server.redirectUrl,
                    error: true,
                    message: err.message
                };
            }
        })
    );

    const formatted = results.map(r => r.value || {
        name: "Unknown Server",
        error: true,
        message: "Unhandled error"
    });

    res.json(formatted);
});
