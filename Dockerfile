FROM node:22-alpine
WORKDIR /app
COPY package.json proxy.mjs tools.json ./
ENTRYPOINT ["node", "proxy.mjs"]
