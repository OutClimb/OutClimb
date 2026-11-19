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
// When useClientIP is false, we use RemoteIP instead of ClientIP.
func RateLimit(count int, window time.Duration, useClientIP bool) gin.HandlerFunc {
	return rateLimit(count, window, useClientIP, false)
}

// UnauthenticatedRateLimit behaves like RateLimit but skips requests that already have
// an authenticated user in the context. It must run after OptionalAuth.
func UnauthenticatedRateLimit(count int, window time.Duration, useClientIP bool) gin.HandlerFunc {
	return rateLimit(count, window, useClientIP, true)
}

func rateLimit(count int, window time.Duration, useClientIP bool, skipAuthenticated bool) gin.HandlerFunc {
	limiter := newIPRateLimiter(count, window)
	return func(c *gin.Context) {
		if skipAuthenticated {
			if _, ok := c.Get("user"); ok {
				c.Next()
				return
			}
		}

		ip := c.RemoteIP()
		if useClientIP {
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
