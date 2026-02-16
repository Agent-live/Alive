FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /alive-backend alive.go

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /alive-backend /usr/local/bin/alive-backend
COPY --from=builder /app/etc /etc/alive
EXPOSE 8888
CMD ["alive-backend", "-f", "/etc/alive/alive-api.yaml"]
