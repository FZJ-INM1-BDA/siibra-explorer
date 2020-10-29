FROM node:12 as builder

ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}

ARG DATASET_PREVIEW_URL
ENV DATASET_PREVIEW_URL=${DATASET_PREVIEW_URL:-https://hbp-kg-dataset-previewer.apps.hbp.eu/v2}

ARG STRICT_LOCAL
ENV STRICT_LOCAL=${STRICT_LOCAL:-false}

ARG KIOSK_MODE
ENV KIOSK_MODE=${KIOSK_MODE:-false}

COPY . /iv
WORKDIR /iv

ARG VERSION
ENV VERSION=${VERSION:-devNext}

RUN npm i
RUN npm run build-aot

# gzipping container
FROM ubuntu:19.10 as compressor
RUN apt upgrade -y && apt update && apt install brotli

RUN mkdir /iv
COPY --from=builder /iv/dist/aot /iv
WORKDIR /iv

RUN for f in $(find . -type f); do gzip < $f > $f.gz && brotli < $f > $f.br; done

# Building doc
FROM python:3.7 as doc-builder

COPY . /iav
WORKDIR /iav

RUN pip install mkdocs mkdocs-material mdx_truly_sane_lists errandkun
RUN mkdocs build

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

# Copy docs
COPY --from=doc-builder /iav/site ./docs

# Copy the resources files needed to respond to queries
# is this even necessary any more?
COPY --from=compressor /iv/res/json ./res
RUN npm i

ENTRYPOINT [ "node", "server.js" ]