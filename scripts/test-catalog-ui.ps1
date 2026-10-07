$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$testMount = "${taskRoot}/frontend/tests/ui:/tests:ro"
$testContainer = 'ninetyeights-catalog-ui-test'

docker run --rm -d --name $testContainer --network host -e PORT=3301 -e HOSTNAME=0.0.0.0 -e API_INTERNAL_URL=http://127.0.0.1:3302 ninetyeights-frontend
if ($LASTEXITCODE -ne 0) { throw 'Cannot start isolated frontend test container.' }
try {
    docker run --rm --network host -e TEST_CATALOG_BASE_URL=http://127.0.0.1:3301 -v $testMount mcr.microsoft.com/playwright:v1.58.2-noble sh -c 'mkdir /work && cp -R /tests /work/tests && cd /work && npm install --no-audit --no-fund playwright@1.58.2 >/dev/null && node --test tests/catalog.test.mjs'
    $testExit = $LASTEXITCODE
} finally {
    docker stop $testContainer | Out-Null
}
if ($testExit -ne 0) { throw 'Catalog browser test failed.' }
