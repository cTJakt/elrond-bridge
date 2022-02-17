#!/bin/bash
# DO NOT PUSH TO DOCKER HUB
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')
IMAGEID="tmp-elrond-bridge:$PACKAGE_VERSION"
echo "Building tmp-elrond-bridge:$PACKAGE_VERSION ..."
docker build -t $IMAGEID .