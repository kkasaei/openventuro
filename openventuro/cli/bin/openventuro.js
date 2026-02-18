#!/usr/bin/env node
import { access, mkdir, readdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = createInterface({ input, output });

const step = (message) => output.write(`- ${message}\n`);
const ok = (message) => output.write(`✔ ${message}\n`);
const fail = (message) => output.write(`✖ ${message}\n`);
const toPosix = (value) => value.replace(/\\/g, '/');

const usage = () => {
  output.write('Usage: openventuro init [project-name] [options]\n\n');
  output.write('Options:\n');
  output.write('  -d, --defaults                 Use defaults (name + vercel)\n');
  output.write('  --deploy-target <target>       vercel | cloudflare-worker\n');
  output.write('  -h, --help                     Show help\n');
};

const ask = async (question, fallback) => {
  const answer = (await rl.question(question)).trim();
  return answer.length ? answer : fallback;
};

const validateTarget = (value) => {
  if (value === 'vercel' || value === 'cloudflare-worker') return value;
  throw new Error(`Invalid deployment target: ${value}`);
};

const askTarget = async ({ defaults, argValue }) => {
  if (argValue) return validateTarget(argValue);
  if (defaults) return 'vercel';

  output.write('\nWhere are we deploying?\n');
  output.write('1) vercel\n');
  output.write('2) cloudflare-worker\n\n');

  while (true) {
    const choice = (await rl.question('Select 1 or 2 (default: 1): ')).trim();
    if (!choice || choice === '1') return 'vercel';
    if (choice === '2') return 'cloudflare-worker';
    output.write('Invalid choice. Please select 1 or 2.\n');
  }
};

const files = (projectName, deployTarget) => ({
  'package.json': JSON.stringify(
    {
      name: projectName,
      private: true,
      packageManager: 'pnpm@10.6.0',
      scripts: {
        build: 'turbo run build',
        dev: 'turbo run dev --parallel',
        lint: 'turbo run lint',
        typecheck: 'turbo run typecheck'
      },
      devDependencies: {
        turbo: '^2.8.9',
        typescript: '^5.9.3'
      }
    },
    null,
    2
  ) + '\n',
  'pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n  - "packages/*"\n',
  'turbo.json': JSON.stringify(
    {
      $schema: 'https://turbo.build/schema.json',
      tasks: {
        build: { dependsOn: ['^build'], outputs: ['dist/**', '.next/**'] },
        dev: { cache: false, persistent: true },
        lint: { dependsOn: ['^lint'] },
        typecheck: { dependsOn: ['^typecheck'] }
      }
    },
    null,
    2
  ) + '\n',
  'tsconfig.base.json': JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        isolatedModules: true,
        noEmit: true,
        baseUrl: '.'
      }
    },
    null,
    2
  ) + '\n',
  '.gitignore': 'node_modules\n.pnpm-store\n.turbo\n.next\ndist\n.env\n.env.*\n.DS_Store\n',
  '.env.example': [
    `DEPLOY_TARGET=${deployTarget}`,
    '',
    'CLOUDFLARE_API_TOKEN=',
    'CLOUDFLARE_ZONE_ID=',
    'STRIPE_SECRET_KEY=',
    'STRIPE_WEBHOOK_SECRET=',
    'RESEND_API_KEY=',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=',
    'CLERK_SECRET_KEY=',
    'DATABASE_URL='
  ].join('\n') + '\n',
  'README.md': `# ${projectName}\n\nScaffolded with openventuro.\n\nThis scaffold already includes the shadcn base setup, so no extra shadcn init step is required.\n`,
  'scripts/cloud-init.yaml': '#cloud-config\npackages:\n  - curl\n  - git\nruncmd:\n  - echo "Cloud init placeholder"\n',
  'apps/api/package.json': JSON.stringify(
    {
      name: '@openventuro/api',
      private: true,
      type: 'module',
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc -p tsconfig.json',
        typecheck: 'tsc -p tsconfig.json --noEmit'
      },
      dependencies: {
        '@hono/node-server': '^1.19.9',
        hono: '^4.11.9',
        resend: '^4.8.0',
        stripe: '^17.7.0'
      },
      devDependencies: {
        '@types/node': '^22.19.11',
        tsx: '^4.21.0',
        typescript: '^5.9.3'
      }
    },
    null,
    2
  ) + '\n',
  'apps/api/tsconfig.json': JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: { outDir: 'dist', types: ['node'] },
      include: ['src']
    },
    null,
    2
  ) + '\n',
  'apps/api/src/index.ts': "import { serve } from '@hono/node-server';\nimport { Hono } from 'hono';\n\nconst app = new Hono();\n\napp.get('/', (c) => c.json({ ok: true, service: '@openventuro/api' }));\n\nconst port = Number(process.env.PORT ?? 8787);\nserve({ fetch: app.fetch, port });\n",
  'apps/Web/package.json': JSON.stringify(
    {
      name: '@openventuro/web',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        typecheck: 'tsc --noEmit'
      },
      dependencies: {
        '@clerk/nextjs': '^6.37.5',
        '@phosphor-icons/react': '^2.1.10',
        '@tanstack/react-query': '^5.90.21',
        'class-variance-authority': '^0.7.1',
        clsx: '^2.1.1',
        'framer-motion': '^12.34.1',
        'lucide-react': '^0.574.0',
        next: '15.2.3',
        react: '19.0.3',
        'react-dom': '19.0.3',
        'tailwind-merge': '^3.4.1',
        'tailwindcss-animate': '^1.0.7'
      },
      devDependencies: {
        '@types/node': '^22.19.11',
        '@types/react': '^19.2.14',
        '@types/react-dom': '^19.2.3',
        autoprefixer: '^10.4.24',
        postcss: '^8.5.6',
        tailwindcss: '^3.4.19',
        typescript: '^5.9.3'
      }
    },
    null,
    2
  ) + '\n',
  'apps/Web/tsconfig.json': JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        lib: ['dom', 'dom.iterable', 'esnext'],
        jsx: 'preserve',
        allowJs: true,
        incremental: true,
        baseUrl: '.',
        paths: { '@/*': ['./*'] },
        types: ['node'],
        plugins: [{ name: 'next' }]
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
      exclude: ['node_modules']
    },
    null,
    2
  ) + '\n',
  'apps/Web/next-env.d.ts': '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n',
  'apps/Web/next.config.ts': "import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n",
  'apps/Web/postcss.config.js': "module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {}\n  }\n};\n",
  'apps/Web/tailwind.config.ts': "import type { Config } from 'tailwindcss';\n\nconst config: Config = {\n  darkMode: ['class'],\n  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],\n  theme: {\n    extend: {\n      borderRadius: {\n        lg: 'var(--radius)',\n        md: 'calc(var(--radius) - 2px)',\n        sm: 'calc(var(--radius) - 4px)'\n      },\n      colors: {\n        background: 'hsl(var(--background))',\n        foreground: 'hsl(var(--foreground))',\n        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },\n        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },\n        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },\n        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },\n        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },\n        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },\n        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },\n        border: 'hsl(var(--border))',\n        input: 'hsl(var(--input))',\n        ring: 'hsl(var(--ring))'\n      }\n    }\n  },\n  plugins: [require('tailwindcss-animate')]\n};\n\nexport default config;\n",
  'apps/Web/components.json': JSON.stringify(
    {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'new-york',
      rsc: true,
      tsx: true,
      tailwind: {
        config: 'tailwind.config.ts',
        css: 'app/globals.css',
        baseColor: 'neutral',
        cssVariables: true,
        prefix: ''
      },
      iconLibrary: 'lucide',
      rtl: false,
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks'
      },
      registries: {}
    },
    null,
    2
  ) + '\n',
  'apps/Web/lib/utils.ts': "import { clsx, type ClassValue } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n",
  'apps/Web/app/layout.tsx': "import './globals.css';\nimport type { Metadata } from 'next';\nimport { Geist, Geist_Mono } from 'next/font/google';\nimport type { ReactNode } from 'react';\n\nconst geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });\nconst geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });\n\nexport const metadata: Metadata = {\n  title: 'OpenVenturo',\n  description: 'Marketing base website'\n};\n\nexport default function RootLayout({ children }: { children: ReactNode }) {\n  return (\n    <html lang='en'>\n      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>\n    </html>\n  );\n}\n",
  'apps/Web/app/page.tsx': "export default function Home() {\n  return (\n    <main className='min-h-screen bg-slate-950 text-white'>\n      <section className='mx-auto max-w-4xl px-6 py-24'>\n        <p className='mb-4 text-sm uppercase tracking-[0.2em] text-cyan-300'>OpenVenturo</p>\n        <h1 className='text-5xl font-semibold leading-tight'>Marketing website base is ready.</h1>\n        <p className='mt-6 max-w-2xl text-lg text-slate-300'>\n          The shadcn base setup is already included. Start adding UI components directly.\n        </p>\n      </section>\n    </main>\n  );\n}\n",
  'apps/Web/app/globals.css': "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  color-scheme: dark;\n}\n\nbody {\n  margin: 0;\n  font-family: var(--font-geist-sans), system-ui, sans-serif;\n  background: #020617;\n}\n\n@layer base {\n  :root {\n    --background: 0 0% 100%;\n    --foreground: 0 0% 3.9%;\n    --card: 0 0% 100%;\n    --card-foreground: 0 0% 3.9%;\n    --popover: 0 0% 100%;\n    --popover-foreground: 0 0% 3.9%;\n    --primary: 0 0% 9%;\n    --primary-foreground: 0 0% 98%;\n    --secondary: 0 0% 96.1%;\n    --secondary-foreground: 0 0% 9%;\n    --muted: 0 0% 96.1%;\n    --muted-foreground: 0 0% 45.1%;\n    --accent: 0 0% 96.1%;\n    --accent-foreground: 0 0% 9%;\n    --destructive: 0 84.2% 60.2%;\n    --destructive-foreground: 0 0% 98%;\n    --border: 0 0% 89.8%;\n    --input: 0 0% 89.8%;\n    --ring: 0 0% 3.9%;\n    --radius: 0.5rem;\n  }\n\n  .dark {\n    --background: 0 0% 3.9%;\n    --foreground: 0 0% 98%;\n    --card: 0 0% 3.9%;\n    --card-foreground: 0 0% 98%;\n    --popover: 0 0% 3.9%;\n    --popover-foreground: 0 0% 98%;\n    --primary: 0 0% 98%;\n    --primary-foreground: 0 0% 9%;\n    --secondary: 0 0% 14.9%;\n    --secondary-foreground: 0 0% 98%;\n    --muted: 0 0% 14.9%;\n    --muted-foreground: 0 0% 63.9%;\n    --accent: 0 0% 14.9%;\n    --accent-foreground: 0 0% 98%;\n    --destructive: 0 62.8% 30.6%;\n    --destructive-foreground: 0 0% 98%;\n    --border: 0 0% 14.9%;\n    --input: 0 0% 14.9%;\n    --ring: 0 0% 83.1%;\n  }\n}\n",
  'packages/shared/package.json': '{\n  "name": "@openventuro/shared",\n  "version": "0.0.0",\n  "private": true\n}\n',
  'packages/shared/src/index.ts': 'export {};\n',
  'packages/i18n/package.json': '{\n  "name": "@openventuro/i18n",\n  "version": "0.0.0",\n  "private": true\n}\n',
  'packages/i18n/src/index.ts': 'export {};\n',
  'packages/ui/package.json': '{\n  "name": "@openventuro/ui",\n  "version": "0.0.0",\n  "private": true\n}\n',
  'packages/ui/src/index.ts': 'export {};\n',
  'packages/db/package.json': '{\n  "name": "@openventuro/db",\n  "version": "0.0.0",\n  "private": true\n}\n',
  'packages/db/src/index.ts': 'export {};\n',
  'packages/trpc/package.json': '{\n  "name": "@openventuro/trpc",\n  "version": "0.0.0",\n  "private": true\n}\n',
  'packages/trpc/src/index.ts': 'export {};\n'
});

const ensureEmptyOrMissing = async (targetDir) => {
  try {
    await access(targetDir, constants.F_OK);
  } catch {
    return;
  }

  const entries = await readdir(targetDir);
  if (entries.length) throw new Error(`Target directory is not empty: ${targetDir}`);
};

const parseArgs = (argv) => {
  let projectName;
  let defaults = false;
  let deployTarget;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '-d' || arg === '--defaults' || arg === '--yes') {
      defaults = true;
      continue;
    }

    if (arg === '--deploy-target') {
      const value = argv[i + 1];
      if (!value) throw new Error('Missing value for --deploy-target');
      deployTarget = value;
      i += 1;
      continue;
    }

    if (arg.startsWith('--deploy-target=')) {
      deployTarget = arg.split('=')[1];
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (!projectName) {
      projectName = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  return { projectName, defaults, deployTarget };
};

const runInit = async (argv) => {
  step('Preflight checks.');
  const { projectName: argName, defaults, deployTarget: argTarget } = parseArgs(argv);

  const projectName = argName || (defaults ? 'openventuro-app' : await ask('Project name (default: openventuro-app): ', 'openventuro-app'));
  const deployTarget = await askTarget({ defaults, argValue: argTarget });

  const cwd = process.cwd();
  const targetDir = path.resolve(cwd, projectName);

  await ensureEmptyOrMissing(targetDir);
  ok('Preflight checks.');

  step('Scaffolding project.');
  await mkdir(targetDir, { recursive: true });

  const scaffoldFiles = files(projectName, deployTarget);
  for (const [relative, content] of Object.entries(scaffoldFiles)) {
    const abs = path.join(targetDir, relative);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, content, 'utf8');
  }
  ok('Scaffolding project.');
  ok('Included shadcn base setup (no extra init required).');

  const relative = path.relative(cwd, targetDir);
  const displayPath = path.isAbsolute(projectName) ? toPosix(targetDir) : toPosix(relative || '.');

  output.write(`\nSuccess! Project initialized in ${displayPath}\n`);
  output.write('\nNext steps:\n');
  output.write(`  cd ${displayPath}\n`);
  output.write('  pnpm install\n');
  output.write('  pnpm dev\n\n');
  output.write(`Deployment target selected: ${deployTarget}\n`);
};

const main = async () => {
  const argv = process.argv.slice(2);

  if (!argv.length) {
    await runInit([]);
    return;
  }

  if (argv[0] === '-h' || argv[0] === '--help') {
    usage();
    return;
  }

  if (argv[0] === 'init') {
    await runInit(argv.slice(1));
    return;
  }

  if (argv[0].startsWith('-')) {
    usage();
    throw new Error(`Unknown command or option: ${argv[0]}`);
  }

  await runInit(argv);
};

main()
  .catch((error) => {
    fail('Operation failed.');
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
  });
