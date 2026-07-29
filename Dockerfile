FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Explicitly copy the asset to ensure it is included
COPY static_assets/general_midi.sf2 ./static_assets/general_midi.sf2
RUN npm run build
# Kopiere die statischen Assets nach dem Build, damit Vite sie nicht löscht
RUN mkdir -p dist/samples/instruments && cp static_assets/general_midi.sf2 dist/samples/instruments/

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
CMD ["npm", "start"]
