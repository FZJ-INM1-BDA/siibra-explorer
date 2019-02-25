FROM node:8 as builder

COPY . /iv
WORKDIR /iv

ENV VERSION=test

RUN npm i
RUN npm run build-aot


# prod container

FROM node:8-alpine 

ARG PORT
ENV PORT=$PORT

RUN apk --no-cache add ca-certificates
RUN mkdir /iv-app
WORKDIR /iv-app
COPY --from=builder /iv/dist .

EXPOSE $PORT

RUN npm i express

ENTRYPOINT [ "node", "server.js" ]