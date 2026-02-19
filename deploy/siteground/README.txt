SiteGround deployment package generated successfully.

Folders:
1) static/public_html
   - Upload this entire folder content to SiteGround public_html for static-only deployment.
   - Note: secure checkout API routes (/api/*) need a separate backend host.

2) fullstack
   - Contains Node backend + dist for VPS/Cloud deployment where Node.js is supported.
   - Steps: upload, create .env from .env.example, run npm install, then npm start (or PM2).
