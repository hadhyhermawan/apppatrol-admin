# AppPatrol Admin - Deployment Guide

## 📋 Overview

**Project**: AppPatrol Admin Dashboard  
**Framework**: Next.js 16.1.6 (Turbopack)  
**Domain**: https://frontend.k3guard.com  
**Port**: 3010  
**Process Manager**: PM2  
**Backend API**: Python FastAPI (Port 8000)

---

## 🏗️ Architecture

```
Browser → Nginx (443/80) → Next.js (3010) → Python API (8000)
                                          ↓
                                      Database
```

### Directory Structure
```
/var/www/apppatrol-admin/
├── src/                    # Source code
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   └── lib/              # Utilities & API client
├── public/               # Static assets
├── .next/                # Build output (generated)
├── node_modules/         # Dependencies
├── package.json          # Dependencies & scripts
├── next.config.ts        # Next.js configuration
└── .env.local           # Environment variables
```

---

## 🚀 Deployment Steps

### 1. Initial Setup

```bash
cd /var/www/apppatrol-admin

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### 2. Environment Configuration

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://frontend.k3guard.com/api-py
PORT=3010
NODE_ENV=production
```

### 3. Build Application

```bash
# Clean previous build
rm -rf .next

# Build for production
npm run build

# Verify build success - should show 52 pages
# Look for: "✓ Compiled successfully"
```

### 4. PM2 Configuration

```bash
# Start with PM2
cd /var/www/apppatrol-admin
PORT=3010 pm2 start npm --name patrol-frontend -- start

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
```

### 5. Nginx Configuration

File: `/etc/nginx/sites-enabled/frontend.k3guard.com`

```nginx
server {
    server_name frontend.k3guard.com;

    # Python API proxy
    location /api-py/ {
        rewrite ^/api-py/(.*) /api/$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Next.js frontend
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    client_max_body_size 10M;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/frontend.k3guard.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/frontend.k3guard.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    listen 80;
    server_name frontend.k3guard.com;
    return 301 https://$host$request_uri;
}
```

Test and reload Nginx:
```bash
nginx -t
systemctl reload nginx
```

---

## 🔧 Common Operations

### Update Code & Redeploy

```bash
cd /var/www/apppatrol-admin

# Pull latest changes
git pull

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart patrol-frontend

# Check logs
pm2 logs patrol-frontend --lines 50
```

### Check Application Status

```bash
# PM2 status
pm2 list

# Check specific process
pm2 describe patrol-frontend

# View logs
pm2 logs patrol-frontend

# Monitor in real-time
pm2 monit
```

### Test Endpoints

```bash
# Test frontend locally
curl -I http://localhost:3010

# Test through Nginx
curl -I https://frontend.k3guard.com

# Test API proxy
curl -I https://frontend.k3guard.com/api-py/
```

---

## 🐛 Troubleshooting

### Issue: Browser Shows Old Page

**Symptoms**: Changes not visible in browser

**Solutions**:
1. **Hard refresh browser**: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
2. **Clear browser cache**: DevTools → Network → Disable cache
3. **Use incognito mode** to test
4. **Verify build**: Check `.next/` directory has recent timestamp
5. **Check PM2**: `pm2 logs patrol-frontend`

### Issue: 502 Bad Gateway

**Symptoms**: Nginx returns 502 error

**Diagnosis**:
```bash
# Check if Next.js is running
curl -I http://localhost:3010

# Check PM2 status
pm2 list

# Check nginx error log
tail -50 /var/log/nginx/error.log

# Check nginx config
nginx -t
```

**Solutions**:
1. **Restart PM2**: `pm2 restart patrol-frontend`
2. **Check port**: Ensure PM2 runs on port 3010
3. **Verify Nginx config**: `proxy_pass http://127.0.0.1:3010;`
4. **Reload Nginx**: `systemctl reload nginx`

### Issue: Port Already in Use

**Symptoms**: `EADDRINUSE: address already in use :::3010`

**Solutions**:
```bash
# Find process using port 3010
netstat -tulpn | grep 3010
# or
lsof -i :3010

# Kill the process
kill <PID>

# Restart PM2
pm2 restart patrol-frontend
```

### Issue: Build Fails

**Symptoms**: TypeScript errors, compilation errors

**Common Fixes**:

1. **TypeScript errors**:
   ```bash
   # Check for type errors
   npm run build
   
   # Common fixes:
   # - Add proper type casting: `as HTMLInputElement`
   # - Fix import statements
   # - Update type definitions
   ```

2. **SSR errors (window/document not defined)**:
   ```typescript
   // Use dynamic import with ssr: false
   const Component = dynamic(() => import('./Component'), { ssr: false });
   
   // Or check for window
   if (typeof window !== 'undefined') {
     // Client-side only code
   }
   ```

3. **Memory issues**:
   ```bash
   # Increase Node memory
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

### Issue: PM2 Process Crashes

**Diagnosis**:
```bash
pm2 logs patrol-frontend --err --lines 100
```

**Solutions**:
1. **Check error logs** for specific error
2. **Verify environment variables**: `pm2 env 8`
3. **Restart with fresh config**:
   ```bash
   pm2 delete patrol-frontend
   cd /var/www/apppatrol-admin
   PORT=3010 pm2 start npm --name patrol-frontend -- start
   pm2 save
   ```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process info
pm2 info patrol-frontend

# Logs
pm2 logs patrol-frontend --lines 100

# Flush logs
pm2 flush
```

### Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/access.log | grep frontend.k3guard.com

# Error logs
tail -f /var/log/nginx/error.log

# Search for specific errors
grep "frontend.k3guard.com" /var/log/nginx/error.log | tail -50
```

### Application Logs

```bash
# PM2 logs location
/root/.pm2/logs/patrol-frontend-out.log
/root/.pm2/logs/patrol-frontend-error.log

# View logs
tail -f /root/.pm2/logs/patrol-frontend-out.log
```

---

## 🔐 Security Checklist

- ✅ SSL certificate configured (Let's Encrypt)
- ✅ HTTPS redirect enabled
- ✅ Environment variables in `.env.local` (not committed to git)
- ✅ File upload size limited (10M)
- ✅ Proxy headers configured
- ✅ PM2 running as root (consider using dedicated user)

---

## 📝 Important Files

| File | Purpose |
|------|---------|
| `/etc/nginx/sites-enabled/frontend.k3guard.com` | Nginx configuration |
| `/var/www/apppatrol-admin/.env.local` | Environment variables |
| `/var/www/apppatrol-admin/package.json` | Dependencies & scripts |
| `/root/.pm2/dump.pm2` | PM2 saved processes |
| `/root/.pm2/logs/patrol-frontend-*.log` | Application logs |

---

## 🆘 Emergency Recovery

If everything is broken:

```bash
# 1. Stop PM2
pm2 stop patrol-frontend

# 2. Clean build
cd /var/www/apppatrol-admin
rm -rf .next node_modules

# 3. Reinstall
npm install

# 4. Rebuild
npm run build

# 5. Restart PM2
pm2 delete patrol-frontend
PORT=3010 pm2 start npm --name patrol-frontend -- start
pm2 save

# 6. Reload Nginx
nginx -t && systemctl reload nginx

# 7. Test
curl -I https://frontend.k3guard.com
```

---

## 📞 Quick Reference

```bash
# Build
npm run build

# Start PM2
PORT=3010 pm2 start npm --name patrol-frontend -- start

# Restart
pm2 restart patrol-frontend

# Logs
pm2 logs patrol-frontend

# Nginx reload
nginx -t && systemctl reload nginx

# Test
curl -I https://frontend.k3guard.com
```

---

**Last Updated**: 2026-02-17  
**Maintainer**: DevOps Team
