# 1) Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

# 2) NGINX stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE  5174

CMD ["nginx", "-g", "daemon off;"]
