server {
    server_name frontend.k3guard.com;

    # API Proxy for Python Backend (Port 8000)
    location /api-py/ {
        # 1. Fix Double API (e.g. /api-py/api/api/...) -> /api/...
        rewrite ^/api-py/api/api/(.*)$ /api/$1 break;

        # 2. Correct API Path (e.g. /api-py/api/...) -> /api/...
        rewrite ^/api-py/api/(.*)$ /api/$1 break;

        # 3. Missing API Prefix (Web) (e.g. /api-py/login) -> /api/login
        rewrite ^/api-py/(.*)$ /api/$1 break;

        proxy_pass http://127.0.0.1:8000; 
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

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

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/frontend.k3guard.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/frontend.k3guard.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
server {
    if ($host = frontend.k3guard.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name frontend.k3guard.com;
    return 404; # managed by Certbot


}
