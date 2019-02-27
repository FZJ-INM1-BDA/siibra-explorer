FROM node:8 as builder

ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL

COPY . /iv
WORKDIR /iv

ENV VERSION=devNext
ENV DOCKER_BUILD=true

RUN npm i
RUN npm run build-aot


# prod container
FROM node:8-alpine 

ARG PORT
ENV PORT=$PORT
ENV NODE_ENV=production

RUN apk --no-cache add ca-certificates
RUN mkdir /iv-app
WORKDIR /iv-app

# Copy built interactive viewer
COPY --from=builder /iv/dist/aot ./public

# Copy the express server
COPY --from=builder /iv/deploy .

# Copy the resources files needed to respond to queries
COPY --from=builder /iv/src/res/ext ./res
RUN npm i

EXPOSE $PORT

ENTRYPOINT [ "node", "server.js" ]