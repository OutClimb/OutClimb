package middleware

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/OutClimb/OutClimb/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JwtUserClaim struct {
	Username             string `json:"un"`
	Role                 string `json:"r"`
	Name                 string `json:"n"`
	Email                string `json:"e"`
	RequirePasswordReset bool   `json:"pr"`
}

type JwtClaims struct {
	jwt.RegisteredClaims
	Audience string       `json:"aud"`
	User     JwtUserClaim `json:"usr"`
}

func Auth(config *utils.HttpConfig, role *string, resetAllowed bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		authorization := c.GetHeader("Authorization")
		if authorization == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		if !strings.HasPrefix("Bearer ", authorization) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Bearer scheme required"})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(authorization[7:], &JwtClaims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.Jwt.Secret), nil
		})

		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
			c.Abort()
		} else if claims, ok := token.Claims.(*JwtClaims); !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
			c.Abort()
		} else if claims.Audience != c.ClientIP() {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
		} else if userId, err := strconv.Atoi(claims.Subject); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
			c.Abort()
		} else if claims.User.Role != *role {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
		} else if claims.User.RequirePasswordReset && !resetAllowed {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
		} else {
			c.Set("user_id", uint(userId))
			c.Next()
		}
	}
}
