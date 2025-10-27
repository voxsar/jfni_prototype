#!/bin/bash

# Start PHP-FPM in the background
php-fpm -D

# Wait for migrations to run
sleep 5

# Run migrations
php artisan migrate --force

# Start Nginx in the foreground
nginx -g "daemon off;"
