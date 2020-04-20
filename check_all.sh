#! /bin/bash

echo 'Running all tests ...'

echo 'Running linter ...'

# check lint
npm run lint &> check_all_lint.log || exit

echo 'Linter complete.'

echo 'Running unit tests ...'
# unit test
NODE_ENV=test npm run test &> check_all_test.log || exit
echo 'Unit tests complete.'

echo 'Running server tests ...'
cd deploy
npm run test &> check_all_deploy_test.log || exit
echo 'Server test complete.'

cd ..

echo 'Building and running e2e tests ...'
echo 'Building ...'
# e2e tests
npm run build-aot &> check_all_build_aot.log || exit
echo 'Build complete.'

echo 'Spinning up node server ...'
# run node server
cd deploy
node server.js &> check_all_deploy_server.log &
NDOE_SERVER_PID=$!

# run e2e test

echo 'Running e2e tests ...'
cd ..
npm run e2e &> check_all_e2e.log || kill "$NDOE_SERVER_PID" && exit
echo 'e2e tests complete.'

echo 'Killing server.js pid $NDOE_SERVER_PID'

kill "$NDOE_SERVER_PID"

echo 'All runs complete.'
