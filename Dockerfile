FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Este comando de Vite crea el build y sirve en el puerto 5174
RUN npm run build

EXPOSE 5174

CMD ["npm", "run", "preview", "--", "--host", "--port", "5174"]
