FROM node:16 as builder

ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}

ARG SIIBRA_API_ENDPOINTS
ENV SIIBRA_API_ENDPOINTS=${SIIBRA_API_ENDPOINTS:-https://siibra-api-stable.apps.hbp.eu/v3_0,https://siibra-api-stable.apps.jsc.hbp.eu/v3_0}

ARG STRICT_LOCAL
ENV STRICT_LOCAL=${STRICT_LOCAL:-false}

ARG KIOSK_MODE
ENV KIOSK_MODE=${KIOSK_MODE:-false}

ARG MATOMO_URL
ENV MATOMO_URL=${MATOMO_URL}

ARG MATOMO_ID
ENV MATOMO_ID=${MATOMO_ID}

ARG EXPERIMENTAL_FEATURE_FLAG
ENV EXPERIMENTAL_FEATURE_FLAG=${EXPERIMENTAL_FEATURE_FLAG:-false}

ARG ENABLE_LEAP_MOTION
ENV ENABLE_LEAP_MOTION=${ENABLE_LEAP_MOTION:-false}

# mkdir, and copy package.json and package-lock.json and npm i
# to effectively use the caching layer

RUN mkdir /iv
WORKDIR /iv
COPY ./package.json /iv/
COPY ./package-lock.json /iv/
RUN npm i

COPY . /iv/

# angular 12 echo the env var into src/environments/environment.prod.ts
RUN node ./src/environments/parseEnv.js

RUN npm run build
RUN node third_party/matomo/processMatomo.js

# prod container
FROM python:3.10-alpine

RUN adduser --disabled-password nonroot

RUN mkdir /common
COPY --from=builder /iv/common /common

RUN mkdir /iv-app
WORKDIR /iv-app

# Copy the fastapi server
COPY --from=builder /iv/backend .
RUN pip install -r requirements.txt
COPY --from=builder /iv/dist/aot /iv/backend/public

ENV PATH_TO_PUBLIC=/iv/backend/public

RUN chown -R nonroot:nonroot /iv-app
USER nonroot

EXPOSE 8080
ENTRYPOINT uvicorn app.app:app --host 0.0.0.0 --port 8080
