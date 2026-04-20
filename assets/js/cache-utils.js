// Client-Side Cache Utility
// Works alongside Redis backend caching - provides additional client-side caching layer

const CACHE_PREFIX = 'fitTracker_cache_';
const CACHE_VERSION = '1.0'; // Increment to invalidate all caches

// Cache expiration times (in milliseconds)
const CACHE_TTL = {
    profile: 5 * 60 * 1000,        // 5 minutes
    dietPlan: 10 * 60 * 1000,      // 10 minutes
    dietPlans: 10 * 60 * 1000,     // 10 minutes
    exercises: 30 * 60 * 1000,     // 30 minutes (exercise library changes rarely)
    workoutPlan: 10 * 60 * 1000,   // 10 minutes
    trainingProfile: 5 * 60 * 1000  // 5 minutes
};

/**
 * Get cached data if valid, otherwise return null
 */
function getCache(key) {
    try {
        const cacheKey = CACHE_PREFIX + key;
        const cached = localStorage.getItem(cacheKey);
        
        if (!cached) return null;
        
        const parsed = JSON.parse(cached);
        
        // Check version
        if (parsed.version !== CACHE_VERSION) {
            removeCache(key);
            return null;
        }
        
        // Check expiration
        if (parsed.expires && Date.now() > parsed.expires) {
            removeCache(key);
            return null;
        }
        
        return parsed.data;
    } catch (err) {
        console.warn('Cache get error:', err);
        return null;
    }
}

/**
 * Set cache with expiration
 */
function setCache(key, data, ttl = null) {
    try {
        const cacheKey = CACHE_PREFIX + key;
        const ttlMs = ttl || CACHE_TTL[key] || 5 * 60 * 1000; // Default 5 minutes
        
        const cacheData = {
            version: CACHE_VERSION,
            data: data,
            expires: Date.now() + ttlMs,
            cachedAt: Date.now()
        };
        
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (err) {
        // Handle quota exceeded or other storage errors gracefully
        if (err.name === 'QuotaExceededError') {
            console.warn('LocalStorage quota exceeded, clearing old caches');
            clearOldCaches();
            // Try once more
            try {
                const cacheKey = CACHE_PREFIX + key;
                const ttlMs = ttl || CACHE_TTL[key] || 5 * 60 * 1000;
                const cacheData = {
                    version: CACHE_VERSION,
                    data: data,
                    expires: Date.now() + ttlMs,
                    cachedAt: Date.now()
                };
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            } catch (e) {
                console.warn('Failed to cache after cleanup:', e);
            }
        } else {
            console.warn('Cache set error:', err);
        }
    }
}

/**
 * Remove specific cache entry
 */
function removeCache(key) {
    try {
        const cacheKey = CACHE_PREFIX + key;
        localStorage.removeItem(cacheKey);
    } catch (err) {
        console.warn('Cache remove error:', err);
    }
}

/**
 * Clear all caches for a specific pattern
 */
function clearCachePattern(pattern) {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX + pattern)) {
                localStorage.removeItem(key);
            }
        });
    } catch (err) {
        console.warn('Cache pattern clear error:', err);
    }
}

/**
 * Clear all FitTracker caches
 */
function clearAllCaches() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (err) {
        console.warn('Clear all caches error:', err);
    }
}

/**
 * Clear old expired caches to free up space
 */
function clearOldCaches() {
    try {
        const keys = Object.keys(localStorage);
        let cleared = 0;
        
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        if (parsed.expires && Date.now() > parsed.expires) {
                            localStorage.removeItem(key);
                            cleared++;
                        }
                    }
                } catch (e) {
                    // Invalid cache entry, remove it
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        });
        
        if (cleared > 0) {
            console.log(`Cleared ${cleared} expired cache entries`);
        }
    } catch (err) {
        console.warn('Clear old caches error:', err);
    }
}

/**
 * Cached fetch wrapper - checks cache first, then fetches from API
 * Works alongside Redis - Redis still caches on backend, this adds client-side layer
 */
async function cachedFetch(url, options = {}, cacheKey = null, ttl = null) {
    // Generate cache key from URL if not provided
    const key = cacheKey || url.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Try to get from cache first (only for GET requests)
    if (!options.method || options.method === 'GET') {
        const cached = getCache(key);
        if (cached !== null) {
            console.log(`Cache hit: ${key}`);
            return {
                ok: true,
                json: async () => cached,
                cached: true
            };
        }
    }
    
    // Fetch from API (will use Redis cache on backend if available)
    console.log(`Cache miss: ${key}, fetching from API`);
    const response = await fetch(url, options);
    
    // Only cache successful GET responses
    if (response.ok && (!options.method || options.method === 'GET')) {
        try {
            const data = await response.clone().json(); // Clone to avoid consuming response
            setCache(key, data, ttl);
        } catch (err) {
            // Not JSON or other error, don't cache
            console.warn('Failed to cache response:', err);
        }
    }
    
    return response;
}

/**
 * Invalidate cache after updates (POST, PUT, DELETE)
 */
function invalidateCache(key) {
    removeCache(key);
    // Also clear related caches
    if (key.includes('profile')) {
        clearCachePattern('profile');
        clearCachePattern('dietPlan'); // Profile changes affect diet plans
        clearCachePattern('workoutPlan'); // Profile changes affect workout plans
    } else if (key.includes('diet')) {
        clearCachePattern('dietPlan');
        clearCachePattern('dietPlans');
    } else if (key.includes('training') || key.includes('workout')) {
        clearCachePattern('workoutPlan');
        clearCachePattern('trainingProfile');
    }
}

// Clean up old caches on load
if (typeof window !== 'undefined') {
    // Run cleanup once when script loads
    clearOldCaches();
    
    // Clean up every 10 minutes
    setInterval(clearOldCaches, 10 * 60 * 1000);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCache,
        setCache,
        removeCache,
        clearCachePattern,
        clearAllCaches,
        cachedFetch,
        invalidateCache,
        CACHE_TTL
    };
}

