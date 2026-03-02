import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import child from "child_process";
import { configDefaults } from 'vitest/config'

const commitHash = child.execSync("git rev-parse HEAD").toString().trim();

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: process.env.PUBLIC_URL || "",
    server: {
      open: true,
      proxy: {
        '/editor/': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          selfHandleResponse: true,
          configure: (proxy, _options) => {
            proxy.on('proxyRes', (proxyRes, req, res) => {
              const contentType = proxyRes.headers['content-type'] || '';
              // Rewrite JSON responses to replace absolute Opencast URLs with relative paths
              if (contentType.includes('application/json') || contentType.includes('text/json')) {
                let body = '';
                proxyRes.on('data', (chunk: Buffer) => { body += chunk.toString(); });
                proxyRes.on('end', () => {
                  body = body.replaceAll('http://localhost:8080', '');
                  res.writeHead(proxyRes.statusCode || 200, {
                    ...proxyRes.headers,
                    'content-length': Buffer.byteLength(body),
                  });
                  res.end(body);
                });
              } else {
                res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
                proxyRes.pipe(res);
              }
            });
          },
        },
        '/info': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/static': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          auth: 'admin:opencast',
        },
        '/assets': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "build",
    },
    plugins: [
      react({
        jsxImportSource: "@emotion/react",
        babel: {
          plugins: ["@emotion/babel-plugin"],
        },
      }),
      // svgr options: https://react-svgr.com/docs/options/
      svgr({ svgrOptions: { } }),
    ],
    // Workaround, see https://github.com/vitejs/vite/discussions/5912#discussioncomment-6115736
    define: {
      global: "globalThis",
      'import.meta.env.VITE_GIT_COMMIT_HASH': JSON.stringify(commitHash),
      'import.meta.env.VITE_APP_BUILD_DATE': JSON.stringify(new Date().toISOString()),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      exclude: [
        ...configDefaults.exclude,
        './tests',
      ],
    },
  };
});
