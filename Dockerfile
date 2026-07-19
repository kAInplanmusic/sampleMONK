FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Kopiere die statischen Assets manuell nach dem Build, damit Vite sie nicht anfässt
RUN mkdir -p dist/samples/instruments && cp static_assets/general_midi.sf2 dist/samples/instruments/
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
