<p align="center">
  <h1 align="center">openventuro</h1>
  <p align="center">Scaffold a production-ready SaaS monorepo in one command.</p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/openventuro"><img alt="npm version" src="https://img.shields.io/npm/v/openventuro?color=0ea5e9&label=npm"></a>
  <a href="https://github.com/kkasaei/openventuro/blob/main/LICENSE"><img alt="MIT License" src="https://img.shields.io/github/license/kkasaei/openventuro?color=22c55e"></a>
  <a href="https://www.npmjs.com/package/openventuro"><img alt="Node" src="https://img.shields.io/node/v/openventuro?color=a855f7"></a>
</p>

---

## Quick Start

```bash
pnpm dlx openventuro@latest init my-app
cd my-app
pnpm install
pnpm dev
```

That's it. You get a full monorepo with everything wired up.

## What You Get

```
my-app/
├── apps/
│   ├── api/          # Hono API server (Stripe, Resend ready)
│   └── Web/          # Next.js 16 + React 19 + shadcn/ui (pre-configured)
├── packages/
│   ├── shared/       # Shared utilities
│   ├── ui/           # UI component library
│   ├── db/           # Database layer
│   ├── trpc/         # Type-safe API client
│   └── i18n/         # Internationalization
├── turbo.json        # Turborepo pipeline
└── pnpm-workspace.yaml
```

## Stack

| Layer        | Tech                                          |
| ------------ | --------------------------------------------- |
| **Frontend** | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| **Backend**  | Hono                                          |
| **Auth**     | Clerk                                         |
| **Payments** | Stripe                                        |
| **Email**    | Resend                                        |
| **Monorepo** | Turborepo + pnpm workspaces                   |
| **Language** | TypeScript throughout                         |

## Features

- **One command** &mdash; full monorepo scaffolded and ready to run
- **shadcn/ui pre-initialized** &mdash; no extra `shadcn init` step needed
- **Deployment targets** &mdash; choose Vercel or Cloudflare Workers at scaffold time
- **Type-safe end to end** &mdash; tRPC package included for client-server communication
- **Production dependencies** &mdash; auth, payments, and email already wired in

## CLI Usage

```bash
# Interactive (prompts for name and deployment target)
openventuro init

# With arguments
openventuro init my-app

# Skip prompts with defaults (name + Vercel)
openventuro init my-app -d

# Choose Cloudflare Workers
openventuro init my-app --deploy-target cloudflare-worker
```

### Options

| Flag                       | Description                          |
| -------------------------- | ------------------------------------ |
| `-d, --defaults`           | Use defaults (project name + Vercel) |
| `--deploy-target <target>` | `vercel` or `cloudflare-worker`      |
| `-h, --help`               | Show help                            |

## Requirements

- Node.js >= 18
- pnpm (recommended) or npm/yarn

## Publishing

Automated via GitHub Actions. Push a version tag to trigger an npm publish:

```bash
git tag v0.3.0
git push origin v0.3.0
```

Requires the `NPM_TOKEN` repository secret.

## License

[MIT](LICENSE)
