# Stage 1: Build Angular App
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files and install dependencies with legacy peer dependency resolution
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration for routing fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=build /app/dist/test-angular/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]