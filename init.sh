#!/bin/bash

set -eu
set -o pipefail

RPC_URL="${RPC_URL:-"http://localhost:8545"}"
PRIVATE_KEY="${PRIVATE_KEY:-"0x6335c92c05660f35b36148bbfb2105a68dd40275ebf16eff9524d487fb5d57a8"}"

function deploy() {
	contract="$1"
	shift
	address=$(
		forge create \
			--rpc-url "${RPC_URL}" \
			--private-key "${PRIVATE_KEY}" \
				"${contract}" \
				$@ \
		| grep 'Deployed to' | awk '{ print $3 }'
	)

	mkdir -p deployments
	deploymentfile="$(echo $contract | cut -d ":" -f 2)"
	echo "{\"address\": \"${address}\"}" > deployments/${deploymentfile}.json
	echo "${address}"
}

# deploy downstream contracts
DOWNSTREAM_ADDRESS=$(cd lib/ds-contracts && ./init.sh)
EXTENSION_ADDRESS=$(deploy ./src/Game.sol:Extension --constructor-args "${DOWNSTREAM_ADDRESS}")
echo "${EXTENSION_ADDRESS} extends ${DOWNSTREAM_ADDRESS}"

