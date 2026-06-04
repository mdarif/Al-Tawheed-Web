import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';

const root = fileURLToPath(new URL('.', import.meta.url));
const pagefindDir = path.join(root, 'dist/pagefind');

/** Serve Pagefind index in dev (astro-pagefind middleware misses under Vite). */
export function pagefindDev() {
  return {
    name: 'pagefind-dev-static',
    configureServer(server) {
      const serve = sirv(pagefindDir, { dev: true, etag: true });
      server.middlewares.use('/pagefind', (req, res, next) => {
        serve(req, res, () => {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(
            'Pagefind index not found. Run: npm run build\n' +
              '(Search needs a built index in dist/pagefind/)',
          );
        });
      });
    },
  };
}
