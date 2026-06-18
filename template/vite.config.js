import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    {
      name: 'rewrite-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();
          
          const [path, query] = req.url.split('?');
          
          // Rewrite /admin to /admin.html
          if (path === '/admin') {
            req.url = `/admin.html${query ? '?' + query : ''}`;
          } 
          // Exclude other static file requests and root
          else if (
            !path.includes('.') &&
            path !== '/'
          ) {
            req.url = `/job.html${query ? '?' + query : ''}`;
          }
          next();
        });
      }
    },
    {
      name: 'copy-404',
      closeBundle() {
        const jobPath = resolve(__dirname, 'dist/job.html');
        const notFoundPath = resolve(__dirname, 'dist/404.html');
        if (fs.existsSync(jobPath)) {
          fs.copyFileSync(jobPath, notFoundPath);
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        job: resolve(__dirname, 'job.html')
      }
    }
  }
});
