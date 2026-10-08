FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node client ./client
COPY --chown=node:node server ./server
COPY --chown=node:node shared ./shared
ENV NODE_ENV=production PORT=3001
USER node
EXPOSE 3001
CMD ["node", "server/index.js"]
