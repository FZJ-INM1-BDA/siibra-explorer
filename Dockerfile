FROM node:8

ARG PORT
ENV PORT=$PORT

COPY . /iv
WORKDIR /iv

RUN npm i

EXPOSE $PORT

ENTRYPOINT [ "node", "dist/server.js" ]