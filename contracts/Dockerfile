FROM playmint/foundry:v0.8.17

ENV FOUNDRY_SOLC_VERSION=0.8.17
ENV FOUNDRY_OFFLINE=true

# install a watcher
RUN apk add watchexec --repository=https://dl-cdn.alpinelinux.org/alpine/edge/testing

# install solidity from source

# workdir
RUN mkdir -p /contracts
WORKDIR /contracts

# deps
RUN apk add curl bash

COPY lib ./lib
COPY src ./src
COPY test ./test
COPY foundry.toml ./
COPY entrypoint.sh ./
COPY init.sh ./

RUN forge build

ENV DOCKER=true
ENV NODE_ENV=production
ENTRYPOINT ["/contracts/entrypoint.sh"]
CMD []
