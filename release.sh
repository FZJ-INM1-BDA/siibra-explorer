#! /bin/bash

# This is an automated script for TravisCI
# It is triggered on push to master
# It will create a release and publish to the github repo

OWNER=HumanBrainProject
REPO=interactive-viewer
USER=xgui3783
EMAIL=xgui3783@gmail.com
#GITHUB_TOKEN should be populated by CI

test -z "$GITHUB_TOKEN" && exit 1

TAG=$(jq '.version' < package.json)
TAG=${TAG#\"}
TAG=v${TAG%\"}
OBJECT=$(git rev-parse HEAD)
DATE=$(date --iso-8601=seconds)
BODY='{
  "tag": "'$TAG'",
  "message": "Annotated release for '$TAG'",
  "object": "'$OBJECT'",
  "type": "commit",
  "tagger": {
    "name": "'$USER'",
    "email": "'$EMAIL'",
    "date": "'$DATE'"
  }
}'

# Create annotated tag

echo curl -XPOST \
  -H "Accept: application/vnd.github.v3+json" \
  -u "$USER:$GITHUB_TOKEN"\
  -d "$BODY" \
  https://api.github.com/repos/$OWNER/$REPO/git/tags

# Push tag to remote

CREATE_REF_BODY='{
  "ref":"refs/tags/'$TAG'",
  "sha":"'$OBJECT'"
}'

echo curl -XPOST\
  -u "$USER:$GITHUB_TOKEN"\
  -H "Accept: application/vnd.github.v3+json" \
  -d "$CREATE_REF_BODY"\
  https://api.github.com/repos/$OWNER/$REPO/git/refs

# Create release

RELEASE_NOTES=$(sed -e 's/$/\\n/' docs/releases/$TAG.md)

RELEASE_BODY='{
  "tag_name":"'$TAG'",
  "name":"'$TAG'",
  "body":"'$(echo $RELEASE_NOTES)'",
  "target_commitish": "master",
  "draft":false,
  "prerelease":false
}'

echo curl -XPOST\
  -u "$USER:$GITHUB_TOKEN"\
  -H "Accept: application/vnd.github.v3+json" \
  -d "$RELEASE_BODY" \
  https://api.github.com/repos/$OWNER/$REPO/releases
