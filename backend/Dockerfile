ARG NODE_VERSION=22.19.0
FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app

# 1. Copy dependency metadata first for better layer caching
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# 2. Install build dependencies, including devDependencies needed by TypeScript
RUN npm ci

# 3. Copy the application source
COPY src ./src
COPY tsconfig.json ./

# 4. Build the TypeScript application
RUN npm run build

# 5. Switch to production mode and prune dev dependencies
ENV NODE_ENV production
RUN npm prune --omit=dev

# 6. Run as non-root user for security
USER node

# 7. Render uses the $PORT env variable.
# We expose 4000, but Render will override this.
EXPOSE 4000

# 8. Start the compiled application
CMD ["node", "dist/index.js"]
