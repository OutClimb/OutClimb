FROM golang:alpine AS outclimb-local-be-builder

WORKDIR /app

ENV OUTCLIMB_ENV="local"

# Ensure all packages are up to date
RUN apk -U upgrade

# Install tzdata to set timezone
RUN apk --no-cache add tzdata

# Install wgo to allow for watching changes
RUN go install github.com/bokwoon95/wgo@latest

# Set the timezone to be Central Time
RUN ln -s /usr/share/zoneinfo/America/Chicago /etc/localtime
RUN echo "America/Chicago" > /etc/timezone

ENTRYPOINT ["/app/be-entrypoint.sh"]

FROM node:lts-alpine AS outclimb-local-fe-builder

WORKDIR /app

# Ensure all packages are up to date
RUN apk -U upgrade && apk add --no-cache libc6-compat

# Install PNPM
RUN corepack enable
RUN corepack prepare pnpm@11.5.1 --activate

ENTRYPOINT ["/app/fe-entrypoint.sh"]

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
RUN apk -U upgrade && apk add --no-cache libc6-compat

# Install PNPM
RUN corepack enable
RUN corepack prepare pnpm@11.5.1 --activate

# Build the frontend
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM alpine:latest AS outclimb

ENV OUTCLIMB_ENV="prod"

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

# Install Curl for health checks and tzdata to set timezone
RUN apk --no-cache add curl tzdata

# Set the timezone to be Central Time
RUN ln -s /usr/share/zoneinfo/America/Chicago /etc/localtime
RUN echo "America/Chicago" > /etc/timezone

ENTRYPOINT ["/app/outclimb", "service"]
