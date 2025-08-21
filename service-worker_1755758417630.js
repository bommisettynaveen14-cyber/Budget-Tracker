// Budget Tracker PWA Service Worker
const CACHE_NAME = 'budget-tracker-v1.0.0';
const STATIC_CACHE_NAME = 'budget-tracker-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'budget-tracker-dynamic-v1.0.0';

// Files to cache immediately on install
const STATIC_FILES = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('[SW] Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old versions of caches
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('budget-tracker-')) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('[SW] Failed to activate service worker:', error);
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip external requests (different origin)
    if (url.origin !== location.origin) {
        return;
    }
    
    // Skip chrome-extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    event.respondWith(handleFetch(request));
});

// Handle fetch requests with different strategies
async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // Strategy 1: Cache First for static assets
        if (isStaticAsset(request)) {
            return await cacheFirst(request);
        }
        
        // Strategy 2: Network First for API calls or dynamic content
        if (isApiRequest(request)) {
            return await networkFirst(request);
        }
        
        // Strategy 3: Stale While Revalidate for HTML pages
        if (isNavigationRequest(request)) {
            return await staleWhileRevalidate(request);
        }
        
        // Default: Network First
        return await networkFirst(request);
        
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        
        // Return offline fallback
        return await getOfflineFallback(request);
    }
}

// Cache First strategy - for static assets
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('[SW] Cache first failed:', error);
        throw error;
    }
}

// Network First strategy - for dynamic content
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', error.message);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stale While Revalidate strategy - for HTML pages
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    const networkPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.status === 200) {
                const cache = caches.open(DYNAMIC_CACHE_NAME);
                cache.then(c => c.put(request, networkResponse.clone()));
            }
            return networkResponse;
        })
        .catch((error) => {
            console.log('[SW] Network update failed:', error.message);
        });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // If no cached version, wait for network
    return await networkPromise;
}

// Get offline fallback response
async function getOfflineFallback(request) {
    // For navigation requests, return the main app
    if (isNavigationRequest(request)) {
        const cachedApp = await caches.match('/index.html');
        if (cachedApp) {
            return cachedApp;
        }
    }
    
    // For other requests, return a simple offline response
    return new Response(
        JSON.stringify({
            error: 'You are offline',
            message: 'This content is not available offline'
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

// Helper functions to determine request types
function isStaticAsset(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    return pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.json') ||
           pathname.endsWith('.svg') ||
           pathname.endsWith('.png') ||
           pathname.endsWith('.jpg') ||
           pathname.endsWith('.jpeg') ||
           pathname.endsWith('.gif') ||
           pathname.endsWith('.webp') ||
           pathname.endsWith('.ico') ||
           pathname.endsWith('.woff') ||
           pathname.endsWith('.woff2') ||
           pathname.endsWith('.ttf') ||
           pathname.endsWith('.otf');
}

function isApiRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/') ||
           url.pathname.startsWith('/graphql') ||
           url.searchParams.has('api');
}

function isNavigationRequest(request) {
    return request.mode === 'navigate' ||
           (request.method === 'GET' && 
            request.headers.get('accept') && 
            request.headers.get('accept').includes('text/html'));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync-transactions') {
        event.waitUntil(syncTransactions());
    }
});

// Sync transactions when back online
async function syncTransactions() {
    try {
        console.log('[SW] Syncing offline transactions...');
        
        // This would typically sync with a backend API
        // For this offline-first app, we just log the event
        console.log('[SW] Transactions synced successfully');
        
        // Notify all clients about successful sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                data: { success: true }
            });
        });
        
    } catch (error) {
        console.error('[SW] Failed to sync transactions:', error);
        
        // Notify clients about sync failure
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_FAILED',
                data: { error: error.message }
            });
        });
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    let notificationData = {
        title: 'Budget Tracker',
        body: 'You have a new notification',
        icon: '/manifest.json',
        badge: '/manifest.json',
        tag: 'budget-tracker-notification',
        requireInteraction: false,
        data: {
            url: '/'
        }
    };
    
    // Parse push data if available
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            console.error('[SW] Failed to parse push data:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Check if app is already open
                for (let client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window if app is not open
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});

// Message handling from the main app
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                type: 'VERSION',
                version: CACHE_NAME
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches()
                .then(() => {
                    event.ports[0].postMessage({
                        type: 'CACHE_CLEARED',
                        success: true
                    });
                })
                .catch((error) => {
                    event.ports[0].postMessage({
                        type: 'CACHE_CLEARED',
                        success: false,
                        error: error.message
                    });
                });
            break;
            
        default:
            console.log('[SW] Unknown message type:', type);
    }
});

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[SW] All caches cleared');
    } catch (error) {
        console.error('[SW] Failed to clear caches:', error);
        throw error;
    }
}

// Periodic cache cleanup
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(cleanupOldCaches());
    }
});

// Clean up old cache entries
async function cleanupOldCaches() {
    try {
        console.log('[SW] Cleaning up old cache entries...');
        
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const requests = await cache.keys();
        
        // Remove entries older than 7 days
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader) {
                    const responseDate = new Date(dateHeader).getTime();
                    if (responseDate < oneWeekAgo) {
                        await cache.delete(request);
                        console.log('[SW] Removed old cache entry:', request.url);
                    }
                }
            }
        }
        
        console.log('[SW] Cache cleanup completed');
        
    } catch (error) {
        console.error('[SW] Cache cleanup failed:', error);
    }
}

// Error handling for unhandled errors
self.addEventListener('error', (event) => {
    console.error('[SW] Service worker error:', event.error);
});

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service worker script loaded');
