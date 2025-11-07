FROM golang:alpine AS outclimb-builder

COPY . /app
WORKDIR /app

RUN go mod download && go mod verify
RUN go build -v -o /app/outclimb main.go

FROM alpine:latest AS outclimb

WORKDIR /app

COPY --from=outclimb-builder /app/outclimb /app/outclimb
COPY --from=outclimb-builder /app/configs /app/configs
COPY --from=outclimb-builder /app/web /app/web
COPY --from=outclimb-builder /app/LICENSE.md /app/LICENSE.md
COPY --from=outclimb-builder /app/README.md /app/README.md

RUN apk --no-cache add curl

ENTRYPOINT ["/app/outclimb", "service"]
