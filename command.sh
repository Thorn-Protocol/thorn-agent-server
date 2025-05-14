docker run --name rofl-omnifarming-container --platform linux/amd64 --volume ./:/src -it ghcr.io/oasisprotocol/rofl-dev:main

docker start rofl-oracle-container

docker exec -it rofl-oracle-container /bin/bash

docker run -it --platform linux/x86_64 -p8544-8548:8544-8548 -v rofl:/rofls ghcr.io/oasisprotocol/sapphire-localnet

oasis r build --output omnifarming.orc --update-manifest

oasis rofl init --network testnet --paratime sapphire
