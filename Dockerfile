FROM golang:alpine AS outclimb-builder

COPY . /app
WORKDIR /app

# Ensure all packages are up to date
RUN apk -U upgrade

# Build the backend
RUN go mod download && go mod verify
RUN go build -v -o /app/outclimb main.go

FROM node:lts-alpine AS outclimb-fe-builder

COPY . /app
WORKDIR /app

# Ensure all packages are up to date
RUN apk -U upgrade

# Build the frontend
RUN npm ci
RUN npm run build

FROM alpine:latest AS outclimb

WORKDIR /app

# Ensure all packages are up to date
RUN apk -U upgrade

# Copy the backend files
COPY --from=outclimb-builder /app/outclimb /app/outclimb
COPY --from=outclimb-builder /app/configs /app/configs
COPY --from=outclimb-builder /app/web /app/web
COPY --from=outclimb-builder /app/LICENSE.md /app/LICENSE.md
COPY --from=outclimb-builder /app/README.md /app/README.md

# Copy the frontend files
COPY --from=outclimb-fe-builder /app/web/manager /app/web/manager

# Install Curl for health checks
RUN apk --no-cache add curl

ENTRYPOINT ["/app/outclimb", "service"]
