# Deployment documentation

This document outlines the deployment of `siibra-explorer` on EBRAINS infrastructure.

## Overview

`siibra-explorer` are continuously deployed on openshift container platform hosted by EBRAINS.

The continuous deployment of `siibra-explorer` involves the following steps:

- building docker image
- tag the image, and push to registry
- pull and run the newly built image

## Build

This section outlines the procedure of continuously building and archiving docker images of `siibra-explorer`.

### Images

Docker images are built with [`Dockerfile`](../Dockerfile) by github action withs [yml spec](../.github/workflows/docker_img.yml), and pushed to EBRAINS docker image registry at `docker-registry.ebrains.eu`

`docker-registry.ebrains.eu` is set as the registry

`siibra` is set as the namespace

`siibra-explorer` is set as the image name

The built image will be tagged with the branch name. e.g.

`docker-registry.ebrains.eu/siibra/siibra-explorer:{BRANCH_NAME}`

### Registry

The built docker image will then be pushed to `docker-registry.ebrains.eu` with the access token of a bot account with the rights to push image in `siibra` namespace.

The login credentials are stored in github action secrets:

- username: `{{ secrets.EBRAINS_DOCKER_REG_USER }}`
- access token: `{{ secrets.EBRAINS_DOCKER_REG_TOKEN }}`

> :warning: There are currently no mechanism to delete artefacts from `docker-registry.ebrains.eu`. One must periodically, manually delete untagged images to avoid filling of allotted diskspace.

---

// TODO setup retention policy to allow automatic deletion of artefacts

---

## Deployment

This section outlines how the built image are deployed.

> :information_source: Previous internal guides described a combination of s2i with docker build strategy. This has been demonstrated to be both slow (at build time) and unreliable (over the deployment lifetime).

### Variables

| cluster   | name           | value | 
| ---       | ---            | --- |
| prod      | `PROJECT_NAME` | `interactive-viewer` |
|           | `OKD_ENDPOINT` | `https://okd.hbp.eu:443` |
|           | `OKD_SECRET`   | `{{ secrets.OKD_PROD_SECRET }}` (generated once[1] stored in github action secrets) |
| dev       | `PROJECT_NAME` | `interactive-viewer` |
|           | `OKD_ENDPOINT` | `https://okd-dev.hbp.eu:443` |
|           | `OKD_SECRET`   | `{{ secrets.OKD_DEV_SECRET }}` (generated once[1], stored in github action secrets) |


### Triggering deployment

Deployments resides in [docker-img.yml](../.github/workflows/docker_img.yml), `job['trigger-deploy']`. The steps are summarised as below:

- determine if targeting prod or dev cluster.

  - If the trigger is update of `master` or `staging` branch, target prod cluster

  - Anyother branch, target dev cluster

- login to openshift container platform with the command

  ```bash
  oc login ${OKD_ENDPOINT} --token ${OKD_SECRET}
  ```

- checkout project with the command

  ```bash
  oc project ${PROJECT_NAME}
  ```

- check if deployment with name `siibra-explorer-branch-deploy-${SANITIZED_BRANCH_NAME}` exists
  - if exists, rollout latest deployment with the command 
  
    ```bash
    oc rollout latest dc/siibra-explorer-branch-deploy-${SANITIZED_BRANCH_NAME}
    ```

  - if does not exist, create new deployment with name `siibra-explorer-branch-deploy-${SANITIZED_BRANCH_NAME}`, using deployment template[2] with corresponding parameters[3]

### [1] OKD service accounts

In order to deploy on OKD clusters in CI/CD pipeline, it is ideal to create a service account. Openshift container platform maintains [a comprehensive guide](https://docs.openshift.com/container-platform/3.11/dev_guide/service_accounts.html) on service account. This section provides a step by step guide on creating the service account.

> :information_source: Why not just use personal access token? 1/ it expires, 2/ it is invalidated when you logout, 3/ (to a less degree, since personal access token has a expiration), revoking personal access token has a greater impact on developer experience, and potentially breaks more things, if one reuses the same personally access token.

#### Prereq

- openshift cli installed (check via `which oc`)
- login command (easiest method to obtain login command: login via web portal > portrait username (*top right*) > Copy Login Command )

#### Configure a Service Account

- login via terminal (paste login command from prereq)
- select the desired project via `oc project ${PROJECT_NAME}`
- create a new SA via: `oc create sa ${SERVICE_ACCOUNT_NAME}`
- get a new token via: `oc sa get-token ${SERVICE_ACCOUNT_NAME}` (store this token securely, ideally in a password manager)
- grant the SA ability to create deployments via: `oc policy add-role-to-user edit -z ${SERVICE_ACCOUNT_NAME}`


### [2] Deployment template

An [openshift template](./okd-branch-tmpl.yaml) has been added to both production (https://okd.hbp.eu) and develop (https://okd-dev.hbp.eu) clusters.

This is done ahead of any deploys, is valid for all future deploys and rarely needs to be updated.

> :warning: The process of editing template is fragile and error prone. One should be vigilant and update the template as little as possible. Ideally, add new templates and alter the deployment pipeline, rather than edit existing templates.

The template is produced mainly by referencing Openshift container platform [template API](https://docs.openshift.com/container-platform/3.11/rest_api/template_openshift_io/template-template-openshift-io-v1.html).

A number of sensitive variables are stored on the openshift clusters, and added to the container at runtime. They include:

| variable name | from | description |
| --- | --- | --- |
| `REDIS_PASSWORD` | `okd_secret.redis-rate-limiting-db-ephemeral.database-password` | password to redis |
| `*` | `okd_configmap.hbp-oauth-config-map.*` | Contains Client ID, Client secret etc for oauth with EBRAINS IAM service |
| `*` | `okd_configmap.fluent-logging.*` | Contains fluentd logging variables |
| `*` | `okd_configmap.plugins.*` | Contains plugins variables |
| `*` | `okd_configmap.other-deploy-config.*` | Contains other deploy variables |

### [3] Deployment parameters

Per [deployment template](./okd-branch-tmpl.yaml), a number of parameters may be required when creating new deployments.

| name | required | desc | 
| --- | --- | --- |
| `SESSION_SECRET` | | Random strings to encrypt sessions. Not currently used. |
| `BRANCH_NAME` | true | Determines the tag of the image to pull. |
| `SANITIZED_BRANCH_NAME` | true | Strip all special characters from `BRANCH_NAME`. Acts similar to deploy ID. Distinguishes one deployment from another. Also affects routes: `siibra-explorer-{SANITIZED_BRANCH_NAME}.apps{PATH_POSTFIX}.hbp.eu` |
| `PATH_POSTFIX` | | Dictates if postfix, if any, should be added to the route: `siibra-explorer-{DEPLOY_FLAVOUR}.apps{PATH_POSTFIX}.hbp.eu`. Defaults to `''` (empty string). Possible value: `-dev`|
| `BUILD_TEXT` | | Shows as over lay text, to mark dev build. Defaults to `dev build` |