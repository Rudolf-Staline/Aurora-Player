import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

interface ViteServer {
  middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void };
}

interface IncomingMessage {
  url?: string;
}

interface ServerResponse {
  statusCode: number;
  setHeader: (header: string, value: string) => void;
  end: (data?: string) => void;
}

const rawProxyPlugin = () => ({
  name: 'raw-proxy',
  configureServer(server: ViteServer) {
    server.middlewares.use('/raw-proxy', async (req: IncomingMessage, res: ServerResponse) => {
      const urlStr = new URL(req.url || '', 'http://localhost').searchParams.get('url');
      if (!urlStr) {
         res.statusCode = 400;
         return res.end('Missing url parameter');
      }
      try {
        const fetchRes = await fetch(urlStr, { 
           redirect: 'follow', 
           signal: AbortSignal.timeout(10000) 
        });
        const body = await fetchRes.text();
        res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/xml');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(body);
      } catch (err: unknown) {
         res.statusCode = 500;
         res.end(err instanceof Error ? err.toString() : 'Unknown error');
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), rawProxyPlugin()],
  server: {
    proxy: {
      '/rss2json-proxy': {
        target: 'https://api.rss2json.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/rss2json-proxy/, ''),
      },
      '/itunes-proxy': {
        target: 'https://itunes.apple.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/itunes-proxy/, ''),
      },
      '/drive-stream': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/drive-stream/, '/drive/v3/files'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const url = new URL('http://localhost' + (req.url || ''));
            const token = url.searchParams.get('token');
            if (token) {
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
              url.searchParams.delete('token');
              proxyReq.path = url.pathname + '?' + url.searchParams.toString() + '&alt=media';
            }
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
