FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
# Next's standalone trace omits the pdfjs fake-worker module loaded dynamically.
COPY --from=build --chown=nextjs:nextjs /app/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs ./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs
# Tesseract loads its WebAssembly core dynamically, so it is not traced either.
COPY --from=build --chown=nextjs:nextjs /app/node_modules/tesseract.js-core/*.wasm ./node_modules/tesseract.js-core/
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
