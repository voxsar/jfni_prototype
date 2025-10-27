# Nginx Reverse Proxy Configuration

This directory contains nginx configuration files for reverse proxy support, enabling custom domain names for the frontend and backend services.

## Features

- **Reverse Proxy**: Routes traffic to appropriate services (frontend/backend)
- **Custom Domains**: Support for custom domain names
- **Load Balancing**: Can be extended for multiple backend instances
- **SSL/TLS Support**: Ready for HTTPS configuration

## Default Configuration

The application is configured to work with:

- **Frontend**: `frontend.jfni.artslabcreatives.com`
- **Backend API**: `backend.jfni.artslabcreatives.com`
- **Local Access**: `http://localhost` (routes to frontend, `/api` and `/admin` to backend)

## Local Development Setup

### 1. Update Your Hosts File

To use custom domains locally, add these entries to your `/etc/hosts` file (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 frontend.jfni.artslabcreatives.com
127.0.0.1 backend.jfni.artslabcreatives.com
```

### 2. Start the Application

```bash
docker-compose up --build
```

### 3. Access the Application

- **Frontend**: http://frontend.jfni.artslabcreatives.com
- **Backend API**: http://backend.jfni.artslabcreatives.com/api/health
- **Filament Admin**: http://backend.jfni.artslabcreatives.com/admin
- **Local Frontend**: http://localhost
- **Local Backend**: http://localhost/api/health
- **Local Admin**: http://localhost/admin

## Production Deployment

### 1. DNS Configuration

Point your domain names to your server's IP address:

```
A Record: frontend.jfni.artslabcreatives.com -> YOUR_SERVER_IP
A Record: backend.jfni.artslabcreatives.com -> YOUR_SERVER_IP
```

### 2. SSL/TLS Configuration

Add SSL certificates using Let's Encrypt:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d frontend.jfni.artslabcreatives.com
sudo certbot --nginx -d backend.jfni.artslabcreatives.com
```

Or manually add SSL configuration to `nginx/conf.d/default.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name backend.jfni.artslabcreatives.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://backend:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name backend.jfni.artslabcreatives.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Update Environment Variables

Update `docker-compose.yml` and `.env` files with production URLs:

**Backend `.env`:**
```
APP_URL=https://backend.jfni.artslabcreatives.com
APP_DEBUG=false
APP_ENV=production
```

**Frontend Environment:**
```
VITE_API_URL=https://backend.jfni.artslabcreatives.com
```

## Custom Domain Configuration

To use your own domain names:

1. **Update `nginx/conf.d/default.conf`**:
   - Replace `frontend.jfni.artslabcreatives.com` with your frontend domain
   - Replace `backend.jfni.artslabcreatives.com` with your backend domain

2. **Update Backend `.env`**:
   ```
   APP_URL=https://your-backend-domain.com
   ```

3. **Update Frontend Environment**:
   ```
   VITE_API_URL=https://your-backend-domain.com
   ```

4. **Rebuild containers**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

## Directory Structure

```
nginx/
├── nginx.conf           # Main nginx configuration
└── conf.d/
    └── default.conf     # Virtual host configurations
```

## Troubleshooting

### Ports Already in Use

If port 80 or 443 is already in use:

```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop the service or modify docker-compose.yml to use different ports
```

### Connection Refused

- Check that all services are running: `docker-compose ps`
- Check nginx logs: `docker-compose logs nginx`
- Verify service connectivity: `docker-compose exec nginx ping backend`

### 502 Bad Gateway

- Backend service might not be ready yet (wait a few seconds)
- Check backend logs: `docker-compose logs backend`
- Verify backend is accessible: `docker-compose exec backend curl http://localhost:3003/api/health`

### Custom Domain Not Working

- Verify hosts file entries
- Clear browser cache and DNS cache: `sudo systemd-resolve --flush-caches` (Linux)
- Check nginx configuration: `docker-compose exec nginx nginx -t`

## Advanced Configuration

### Load Balancing

Add multiple backend instances:

```nginx
upstream backend_cluster {
    server backend1:3003;
    server backend2:3003;
    server backend3:3003;
}

server {
    location / {
        proxy_pass http://backend_cluster;
        # ... other proxy settings
    }
}
```

### Rate Limiting

Add rate limiting to prevent abuse:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location /api {
        limit_req zone=api_limit burst=20;
        proxy_pass http://backend:3003;
    }
}
```

### Caching

Enable caching for static assets:

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    proxy_pass http://frontend:3002;
    proxy_cache my_cache;
    proxy_cache_valid 200 1d;
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Security Considerations

1. **Always use HTTPS in production**
2. **Keep SSL certificates up to date**
3. **Use strong SSL ciphers**
4. **Implement rate limiting**
5. **Add security headers**:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

## Support

For issues with nginx configuration:
- Check official nginx documentation: https://nginx.org/en/docs/
- Review nginx error logs: `docker-compose logs nginx`
- Test configuration: `docker-compose exec nginx nginx -t`
