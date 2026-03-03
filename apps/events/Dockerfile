FROM golang:1.25.0-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN CGO_ENABLED=0 go build -o /event-server ./cmd

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /event-server /event-server

CMD ["/event-server"]
