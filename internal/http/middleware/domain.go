package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Domain(domain string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Host != domain {
			c.Status(http.StatusNotFound)
			c.Abort()
			return
		}

		c.Next()
	}
}
