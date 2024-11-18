# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install yarn if not included in base image
RUN apk add --no-cache yarn

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY tsconfig*.json ./
COPY src/ ./src/

# Build the application
RUN yarn build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install yarn if not included in base image
RUN apk add --no-cache yarn

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy TypeScript configuration file for runtime
COPY --from=builder /app/tsconfig.json ./

# Install NestJS CLI globally
RUN yarn global add @nestjs/cli

# Expose port
EXPOSE 3000

# Start command using Yarn
CMD ["yarn", "start:dev"]