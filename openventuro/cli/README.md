# openventuro CLI

Scaffold a SaaS monorepo in one command.

Package name:

- `openventuro` (public npm package)

## Commands

```bash
openventuro init [project-name] [options]
```

## Options

- `-d, --defaults`: use defaults (`openventuro-app`, `vercel`)
- `--deploy-target <target>`: `vercel` or `cloudflare-worker`
- `-h, --help`: show help

## Examples

```bash
openventuro init my-app
openventuro init my-app -d
openventuro init my-app --deploy-target cloudflare-worker
```

## Install and Run

```bash
pnpm dlx openventuro@latest init my-app
```
