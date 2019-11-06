FROM node:10 as builder

ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}

ARG USE_LOGO
ENV USE_LOGO=${USE_LOGO:-hbp}

COPY . /iv
WORKDIR /iv

ARG VERSION
ENV VERSION=${VERSION:-devNext}

RUN npm i
RUN npm run build-aot

# gzipping container
FROM ubuntu:18.10 as compressor
RUN apt upgrade -y && apt update && apt install brotli

RUN mkdir /iv
COPY --from=builder /iv/dist/aot /iv
WORKDIR /iv

RUN for f in $(find . -type f); do gzip < $f > $f.gz && brotli < $f > $f.br; done

# prod container
FROM node:10-alpine 

ENV NODE_ENV=production

RUN apk --no-cache add ca-certificates
RUN mkdir /iv-app
WORKDIR /iv-app

# Copy the express server
COPY --from=builder /iv/deploy .

# Copy built interactive viewer
COPY --from=compressor /iv ./public

# Copy the resources files needed to respond to queries
# is this even necessary any more?
COPY --from=compressor /iv/res/json ./res
RUN npm i

ENTRYPOINT [ "node", "server.js" ]