FROM node:12 as builder

ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}

ARG DATASET_PREVIEW_URL
ENV DATASET_PREVIEW_URL=${DATASET_PREVIEW_URL:-https://hbp-kg-dataset-previewer.apps.hbp.eu/v2}

ARG BS_REST_URL
ENV BS_REST_URL=${BS_REST_URL:-https://siibra-api-stable.apps.hbp.eu/v1_0}

ARG STRICT_LOCAL
ENV STRICT_LOCAL=${STRICT_LOCAL:-false}

ARG KIOSK_MODE
ENV KIOSK_MODE=${KIOSK_MODE:-false}

ARG MATOMO_URL
ENV MATOMO_URL=${MATOMO_URL}

ARG MATOMO_ID
ENV MATOMO_ID=${MATOMO_ID}

COPY . /iv
WORKDIR /iv

# When building in local, where node_module already exist, prebuilt binary may throw an error
RUN rm -rf ./node_modules

ARG VERSION
ENV VERSION=${VERSION}

RUN npm i
RUN npm run build-aot

# gzipping container
FROM ubuntu:20.10 as compressor
RUN apt upgrade -y && apt update && apt install brotli

RUN mkdir /iv
COPY --from=builder /iv/dist/aot /iv
WORKDIR /iv

RUN for f in $(find . -type f); do gzip < $f > $f.gz && brotli < $f > $f.br; done

# prod container
FROM node:12-alpine

ENV NODE_ENV=production

RUN apk --no-cache add ca-certificates
RUN mkdir /iv-app
WORKDIR /iv-app

# Copy common folder
COPY --from=builder /iv/common /common

# Copy the express server
COPY --from=builder /iv/deploy .

# Copy built interactive viewer
COPY --from=compressor /iv ./public

# Copy the resources files needed to respond to queries
# is this even necessary any more?
COPY --from=compressor /iv/res/json ./res

RUN chown -R node:node /iv-app

USER node
RUN npm i

EXPOSE 8080
ENV PORT 8080
ENTRYPOINT [ "node", "server.js" ]
