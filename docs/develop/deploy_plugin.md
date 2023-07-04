# Deploy plugin

This section details how plugins can be deployed on ebrains infrastructure (openshift). It should also apply more generally to other infrastructure providers with openshift and/or k8s flavors.

## Prerequisite

- Docker
- Access to self hosted docker registry (e.g. docker-registry.ebrains.eu) [1]
- Access to openshift cluster (e.g. okd.hbp.eu)
- openshift cli `oc` installed [https://github.com/openshift/origin/releases/tag/v3.11.0](https://github.com/openshift/origin/releases/tag/v3.11.0) (for CLI approach)


## How

!!! warning
    This guide assumes the plugin developers are using the template repo provided at [https://github.com/FZJ-INM1-BDA/siibra-toolbox-template](https://github.com/FZJ-INM1-BDA/siibra-toolbox-template), such as [https://github.com/fzj-inm1-bda/siibra-jugex/tree/feat_workerFrontend](https://github.com/fzj-inm1-bda/siibra-jugex/tree/feat_workerFrontend)

!!! info
    This guide assumes plugin developers successfully tested their plugin locally.

!!! info
    This guide is suitable for deploying the application for the initial deployment of the application. Documentation on updating of deployed services can be found at [update_plugin_deployment.md](update_plugin_deployment.md)

You can deploy the plugin either via GUI or CLI.

## How (via CLI)

0. (can be skipped if project already created) Goto https://docker-registry.ebrains.eu/ , create a project (hereafter referred to as `$DOCKER_REG_PROJECT_NAME`). Decide a namespace for your current project, hereafter referred to as `$DOCKER_REG_APP_NAME`

1. In root working directory, build server image with

    ```sh
    docker build \
        -f http.server.dockerfile \
        -t docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-server \
        .
    ```
2. In root working directory, build worker image with

    ```sh
    docker build \
        -f http.worker.dockerfile \
        -t docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-worker \
        .
    ```
3. Login to docker registry via CLI

    ```sh
    docker login -u <USERNAME> -p <PASSWORD> docker-registry.ebrains.eu
    ```

    !!! info
        Most docker registry do **not** require you to use your actual password. In docker-registry.ebrains.eu (Harbor), you can obtain a token with auto expiry by clicking your profile > CLI Secret.

4. Push both worker and server images to docker registry

    ```sh
    docker push docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-worker 
    docker push docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-server 
    ```

5. Login to openshift admin dashboard. (Create a project if you haven't already, hereafter referred to as `$OKD_PROJECT_NAME`). Enter your project by clicking it.

!!! info
    `$OKD_PROJECT_NAME` and `$DOCKER_REG_PROJECT_NAME` may be the same, but they do not have to be.

6. Copy `openshift-service-tmpl.yml` to your working directory, or `cd` into this directory

7. Copy the login command via `(top right) [Your Username]` > `Copy Login Command`. Launch a terminal, paste the login command and hit enter.

8. Select the project with `oc project $OKD_PROJECT_NAME`

9. Once decided on the name of your toolbox (hereafter referred to as `$OKD_APP_NAME` ), start the service with 
    ```sh
    oc new-app \
    -f openshift-service-tmpl.yml \
    -p TOOLBOX_NAME=$OKD_APP_NAME \
    -p TOOLBOX_ROUTE=https://my_app_route.apps.hbp.eu \
    -p TOOLBOX_WORKER_IMAGE=docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-worker \
    -p TOOLBOX_SERVER_IMAGE=docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-server

    ```

!!! info
    `$OKD_APP_NAME` and `$DOCKER_REG_APP_NAME` may be the same, but they do not have to. `$OKD_APP_NAME` is used to refer to all relevant deployments on openshift cluster.

## How (via GUI)

for 0. - 5. (follow How (via CLI))

6. Deploy a redis instance via GUI:
    - `(top right) Add to project` > `Deploy Image` > `(radio button) Image Name`
    - enter `docker-registry.ebrains.eu/monitoring/redis:alpine3.17` in the text field
    - click `(button) [magnifying glass]`
    - change or remember the `name` attribute. Hereafter this attribute will be referred to as `<redis_instance_name>`
    - click `(primary button) Deploy`

7. Deploy the server via GUI:

    - `(top right) Add to project` > `Deploy Image` > `(radio button) Image Name`
    - enter `docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-server` in the text field
    - click `(button) [magnifying glass]`
    - under `Environment Variables`, add the following environment variables[2]:
        - `SIIBRA_TOOLBOX_CELERY_BROKER`=`redis://<redis_instance_name>:6379`
        - `SIIBRA_TOOLBOX_CELERY_RESULT`=`redis://<redis_instance_name>:6379`
    - under `Labels`, add the following labels:
        - `app_role`=`server`
    - click `(primary button) Deploy`

8. Deploy worker via GUI: repeat 7. but
    - use `docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-worker` as the image
    - under `Labels` use the following labels:
        - `app_role`=`worker`

9. Create route (TBD)

## Update Deployment

!!! warning
    The following section only applies if you used _## How (via CLI)_ to deploy your application

The following is an example script which would update the deployed application. 

```sh

# Same as _## How (via CLI)_, first we login ...
oc login https://okd.hbp.eu:443 --token $TOKEN

# ... and select the project
oc project $OKD_PROJECT_NAME

# If you have used a different name for your toolbox. You will have to update this
OKD_APP_NAME=my_app

# You can check if the toolbox name is correct with the following command (should print out three rows)

oc get dc -l app=siibra-toolbox-deploy-$OKD_APP_NAME

# The above command gets all the "deployment config" (dc) which associated with the label app=siibra-toolbox-deploy-$OKD_APP_NAME 
# Labels are key value pairs, which makes identification of resources easier

# Now we can instruct the deployment configuration to rollout latest with
for dc in $(oc get dc -l app=siibra-toolbox-deploy-$OKD_APP_NAME | awk '{print $1}' | tail -n +2)
do 
    oc rollout latest dc/$dc
done
```

## Continuous Deployment

!!! warning
    The following section only applies if you used _## How (via CLI)_ to deploy your application

!!! info
    The `$TOKEN` obtained from OKD GUI expires eventually. You will need to create a service-account. Service account tokens are valid until revoked.

Combining _## How (via CLI)_ and _## Update Deployment_, a continous deployment script might look like

```bash
# Same as _## How (via CLI)_, first we login ...
oc login https://okd.hbp.eu:443 --token $TOKEN

# ... and select the project
oc project $OKD_PROJECT_NAME

APP_LABEL=siibra-toolbox-deploy-$OKD_APP_NAME

if [[ $( oc get dc -l app=$APP_LABEL ) == "0" ]]
then
    oc new-app \
    -f openshift-service-tmpl.yml \
    -p TOOLBOX_NAME=$OKD_APP_NAME \
    -p TOOLBOX_ROUTE=https://my_app_route.apps.hbp.eu \
    -p TOOLBOX_WORKER_IMAGE=docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-worker \
    -p TOOLBOX_SERVER_IMAGE=docker-registry.ebrains.eu/$DOCKER_REG_PROJECT_NAME/$DOCKER_REG_APP_NAME:latest-server
else
    for dc in $(oc get dc -l app=$APP_LABEL | awk '{print $1}' | tail -n +2)
    do 
        oc rollout latest dc/$dc
    done
fi

```

[1] dockerhub rate/count limits pulls from IP addresses. It is likely that the openshift cluster would easily exceed the quota. 
[2] you may have to adjust the variable names if you have changed them in your project

