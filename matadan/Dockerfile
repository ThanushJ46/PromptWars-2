FROM nginx:alpine

# Copy all static files
COPY . /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy and set up entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

# Entrypoint writes env.js from Cloud Run env vars, then starts nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
