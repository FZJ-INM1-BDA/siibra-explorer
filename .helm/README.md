# Deployment

This document is intended for a documentation on how siibra-explorer can be deployed to a [kubernetes (k8s)](https://kubernetes.io/) cluster via [helm](https://helm.sh/).

## Active deployments

- k8s cluster adminstered by ebrains 2.0 is at https://rancher.tc.humanbrainproject.eu
- check k8s documentation on how to authenticate
- to update prod installation

```sh
helm upgrade master .helm/siibra-explorer
```

## Persistent resources

Persistent resources are stored under `.helm/adhoc/*.yml`. They only need to be created once, and do not need to be redeployed each time.

## Chart

Helm chart for each release is stored under `./helm/siibra-explorer/*`.

