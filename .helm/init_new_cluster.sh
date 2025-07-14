#! /bin/bash

cd .helm/adhoc && 
kubectl apply -f pvc-log-volume.yml \
    -f secret-siibra-explorer.yml \
    -f configmap-siibra-explorer.yml \
    -f deployment-redis.yml \
    -f service-redis.yml && \
cd ../..

DEPLOYMENT_NAME="prod"
VERSION=$(jq -r '.version' package.json)

helm \
    install \
    --set image.tag=$VERSION \
    --set podAnnotations.image-digest="dig$VERSION" \
    --set envObj.OVERWRITE_API_ENDPOINT=https://siibra-api.apps.rke2-3-adacloud.tc.humanbrainproject.eu/v3_0 \
    $DEPLOYMENT_NAME .helm/siibra-explorer/
