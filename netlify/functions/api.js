import serverless from 'serverless-http';
import { app } from '../../server/index.js';

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // Normalize path when Netlify redirects from /api/* or directly accesses /.netlify/functions/api/*
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace(/^\/\.netlify\/functions\/api/, '/api') || '/api';
  } else if (event.rawUrl) {
    try {
      const parsedUrl = new URL(event.rawUrl);
      if (parsedUrl.pathname.startsWith('/.netlify/functions/api')) {
        event.path = parsedUrl.pathname.replace(/^\/\.netlify\/functions\/api/, '/api') || '/api';
      }
    } catch {
      // Ignore URL parsing fallback
    }
  }

  return serverlessHandler(event, context);
};

export default handler;
