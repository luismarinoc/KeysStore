# ============================
#   Etapa 1: Build
# ============================
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# ============================
#   Etapa 2: Run con Vite Preview
# ============================
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app /app

EXPOSE 5174

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5174"]
