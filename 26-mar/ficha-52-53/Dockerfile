# Este es el S.O linux con nodejs instalado
FROM node:24-alpine AS base

# Esto es la carpeta donde nuestro codigo va a estar ubicado
WORKDIR /app

COPY package.json ./

# Esto instala los paquetes que necesita nuestra aplicacion
RUN npm install

# Esto es copiar TODO nuestro codigo a la carpeta /app
COPY . .

# Esto expone el puerto 8080
EXPOSE 8080

# Este es el comando por el cual corremos nuestra aplicacion
CMD ["npm", "run", "start"]
