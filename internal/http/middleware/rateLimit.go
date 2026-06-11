//
// Permission Middleware
// Copyright 2026 OutClimb
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

package middleware

import (
	"container/list"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

const rateLimitMaxEntries = 10_000

type lruEntry struct {
	limiter *rate.Limiter
	elem    *list.Element
}

type ipRateLimiter struct {
	mu      sync.Mutex
	entries map[string]*lruEntry
	order   *list.List
	r       rate.Limit
	burst   int
}

func newIPRateLimiter(count int, window time.Duration) *ipRateLimiter {
	return &ipRateLimiter{
		entries: make(map[string]*lruEntry, rateLimitMaxEntries),
		order:   list.New(),
		r:       rate.Limit(float64(count) / window.Seconds()),
		burst:   count,
	}
}

func (l *ipRateLimiter) get(ip string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()

	if e, ok := l.entries[ip]; ok {
		l.order.MoveToFront(e.elem)
		return e.limiter
	}

	if len(l.entries) >= rateLimitMaxEntries {
		back := l.order.Back()
		if back != nil {
			l.order.Remove(back)
			delete(l.entries, back.Value.(string))
		}
	}

	lim := rate.NewLimiter(l.r, l.burst)
	elem := l.order.PushFront(ip)
	l.entries[ip] = &lruEntry{limiter: lim, elem: elem}
	return lim
}

// RateLimit returns a middleware that allows at most count requests per window per IP.
// Per-IP limiters are kept in an LRU capped at rateLimitMaxEntries to bound memory.
// When trustedProxies is empty, we use RemoteIP instead of ClientIP.
func RateLimit(count int, window time.Duration, trustedProxies []string) gin.HandlerFunc {
	limiter := newIPRateLimiter(count, window)
	hasTrustedProxies := len(trustedProxies) > 0

	return func(c *gin.Context) {
		ip := c.RemoteIP()
		if hasTrustedProxies {
			ip = c.ClientIP()
		}
		if !limiter.get(ip).Allow() {
			log.Printf("Error: Rate limit exceeded for IP %s\n", ip)
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Too many requests"})
			c.Abort()
			return
		}
		c.Next()
	}
}
