/**
 * Sudoku Game - Service Worker
 * Provides offline functionality and caching for PWA features
 */

const CACHE_NAME = 'sudoku-game-v1.0.0';
const STATIC_CACHE = 'sudoku-static-v1.0.0';
const DYNAMIC_CACHE = 'sudoku-dynamic-v1.0.0';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/game.css',
    '/js/game.js',
    '/js/controls.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/favicon.svg',
    '/icons/favicon.png'
];

// Dynamic content patterns
const DYNAMIC_PATTERNS = [
    /^https:\/\/fonts\.googleapis\.com/,
    /^https:\/\/fonts\.gstatic\.com/,
    /^https:\/\/cdnjs\.cloudflare\.com/
];

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('📦 Caching static files');
                return cache.addAll(STATIC_FILES.map(url => {
                    // Handle root path
                    if (url === '/') {
                        return new Request(url, {
                            cache: 'reload'
                        });
                    }
                    return url;
                }));
            }),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== CACHE_NAME) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Claim all clients
            self.clients.claim()
        ])
    );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        // Static files - Cache First strategy
        if (STATIC_FILES.some(file => request.url.endsWith(file) || request.url.includes(file))) {
            event.respondWith(cacheFirst(request, STATIC_CACHE));
        }
        // Dynamic content - Network First strategy
        else if (DYNAMIC_PATTERNS.some(pattern => pattern.test(request.url))) {
            event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        }
        // Same origin requests - Stale While Revalidate
        else if (url.origin === location.origin) {
            event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
        }
        // External requests - Network First with fallback
        else {
            event.respondWith(networkFirst(request, DYNAMIC_CACHE));
        }
    }
});

/**
 * Cache First Strategy
 * Good for static assets that don't change often
 */
async function cacheFirst(request, cacheName) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache First strategy failed:', error);
        return await caches.match('/index.html') || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Network First Strategy
 * Good for dynamic content that changes frequently
 */
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('Network request failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
            return await caches.match('/index.html') || new Response('Offline', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        }
        
        throw error;
    }
}

/**
 * Stale While Revalidate Strategy
 * Good for content that can be slightly stale
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Fetch in background to update cache
    const networkResponsePromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Network failed, but we might have cache
        return cachedResponse;
    });
    
    // Return cached version immediately if available
    return cachedResponse || networkResponsePromise;
}

/**
 * Background Sync for game saves
 */
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'save-game-state') {
        event.waitUntil(syncGameState());
    }
});

/**
 * Sync game state when back online
 */
async function syncGameState() {
    try {
        // Get saved game states from IndexedDB or localStorage
        const gameStates = await getOfflineGameStates();
        
        if (gameStates && gameStates.length > 0) {
            // Process each saved state
            for (const state of gameStates) {
                await processGameState(state);
            }
            
            // Clear offline saves after successful sync
            await clearOfflineGameStates();
            
            // Notify all clients
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'GAME_STATE_SYNCED',
                    count: gameStates.length
                });
            });
        }
    } catch (error) {
        console.error('Failed to sync game state:', error);
    }
}

/**
 * Get offline game states
 */
async function getOfflineGameStates() {
    // This would integrate with IndexedDB for more robust offline storage
    // For now, return empty array as localStorage is handled client-side
    return [];
}

/**
 * Process individual game state
 */
async function processGameState(state) {
    // Process game state - could upload to server, validate, etc.
    console.log('Processing game state:', state);
}

/**
 * Clear offline game states after sync
 */
async function clearOfflineGameStates() {
    // Clear processed states
    console.log('Cleared offline game states');
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'New puzzle available!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/favicon.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: [
            {
                action: 'play',
                title: 'Play Now',
                icon: '/icons/play-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Maybe Later'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Sudoku Game', options)
    );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'play') {
        // Open game and focus window
        event.waitUntil(
            clients.matchAll().then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes('/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
    // 'dismiss' action just closes notification
});

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_GAME_STATE':
            // Cache game state for offline use
            cacheGameState(data);
            break;
            
        case 'GET_CACHE_STATUS':
            // Return cache information
            getCacheStatus().then(status => {
                event.ports[0].postMessage(status);
            });
            break;
            
        case 'CLEAR_CACHE':
            // Clear specific caches
            clearGameCache(data.cacheNames).then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
    }
});

/**
 * Cache game state
 */
async function cacheGameState(gameState) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = new Response(JSON.stringify(gameState));
        await cache.put('/game-state', response);
        console.log('Game state cached successfully');
    } catch (error) {
        console.error('Failed to cache game state:', error);
    }
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {
        caches: cacheNames,
        totalSize: 0,
        staticCached: false,
        dynamicCached: false
    };
    
    // Check if static files are cached
    const staticCache = await caches.open(STATIC_CACHE);
    const staticKeys = await staticCache.keys();
    status.staticCached = staticKeys.length > 0;
    
    // Check dynamic cache
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    const dynamicKeys = await dynamicCache.keys();
    status.dynamicCached = dynamicKeys.length > 0;
    
    return status;
}

/**
 * Clear specified caches
 */
async function clearGameCache(cacheNames = []) {
    const promises = cacheNames.map(name => caches.delete(name));
    return Promise.all(promises);
}

/**
 * Periodic cleanup of old cache entries
 */
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(performCacheCleanup());
    }
});

/**
 * Perform cache cleanup
 */
async function performCacheCleanup() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        
        // Remove entries older than 7 days
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const now = Date.now();
        
        for (const request of requests) {
            const response = await cache.match(request);
            const dateHeader = response.headers.get('date');
            
            if (dateHeader) {
                const responseDate = new Date(dateHeader).getTime();
                if (now - responseDate > maxAge) {
                    await cache.delete(request);
                    console.log('Cleaned up old cache entry:', request.url);
                }
            }
        }
    } catch (error) {
        console.error('Cache cleanup failed:', error);
    }
}

console.log('🚀 Sudoku Game Service Worker loaded successfully');