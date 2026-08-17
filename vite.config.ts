import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import 'dotenv/config';
import {
  handleCreateCheckoutSession,
  handleVerifySession,
  parseJsonBody,
} from './src/server/stripeHandlers';
import { isStripeConfigured, getStripeMode } from './src/server/stripeService';

function stripeApiPlugin(): Plugin {
  return {
    name: 'stripe-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        const url = rawUrl.split('?')[0];

        // Ensure CORS headers on all /api requests
        if (url.startsWith('/api/')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, stripe-signature');
        }

        // Handle OPTIONS Preflight
        if (req.method === 'OPTIONS' && url.startsWith('/api/')) {
          res.statusCode = 200;
          return res.end();
        }

        if (url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              status: 'ok',
              service: 'Aron Taxi API (Dev/Vite)',
              stripeConfigured: isStripeConfigured(),
              mode: getStripeMode(),
              timestamp: new Date().toISOString(),
            })
          );
        }

        if (url === '/api/stripe-config') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              isConfigured: isStripeConfigured(),
              mode: getStripeMode(),
              publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
              message: isStripeConfigured()
                ? `Stripe er tilkoblet (${getStripeMode() === 'live' ? 'Produksjon' : 'Testmodus'}).`
                : 'Stripe Secret Key mangler i Secrets.',
            })
          );
        }

        if (url === '/api/create-checkout-session' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const origin = (req.headers.origin || req.headers.host) as string | undefined;
            return await handleCreateCheckoutSession(body, origin, res);
          } catch (err: any) {
            console.error('[Vite Stripe Middleware] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'SERVER_ERROR', message: err?.message || 'Serverfeil' }));
          }
        }

        if ((url === '/api/verify-session' || url === '/api/verify-checkout-session') && req.method === 'GET') {
          try {
            const fullUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
            const sessionId = fullUrl.searchParams.get('session_id') || '';
            const tripId = fullUrl.searchParams.get('trip_id') || undefined;
            return await handleVerifySession(sessionId, tripId, res);
          } catch (err: any) {
            console.error('[Vite Stripe Middleware] Verify error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'VERIFY_ERROR', message: err?.message || 'Verifiseringsfeil' }));
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), stripeApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
