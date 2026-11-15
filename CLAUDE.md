# OutClimb
Web service for OutClimb (queer/trans climbing non-profit). Monorepo: Go `backend` + React `packages/manager` and `packages/form`. See README for setup.

## Backend
Entrypoint `main.go`; commands in `cmd/` (`create-user`, `migrate`, `service`).
Layers in `internal/`, each calling only the next: `http` → `app` → `store`.
Also `configs/` (config template) and `web/` (static assets).
- Lint: `golangci-lint run`
- Test: `go test ./...`

## Running locally
Run everything with `docker compose up -d`. Ensure `configs/local.env` exists first (copy from `configs/local.env.sample` if missing).

## Frontend (manager, form)
TypeScript, PNPM, Vite, React. Run from repo root:
- `pnpm dev`, `pnpm build`, `pnpm format`, `pnpm lint`, `pnpm test`, `pnpm typecheck`
- Use `:form` or `:manager` suffixes to target one package (`pnpm dev:form`).
