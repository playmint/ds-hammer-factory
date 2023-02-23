# Dawnseekers Building Extension Starter

## Overview

An example/starter repository to fork and get started developing a Building Extension and client plugin for Dawnseekers.

## Getting started

* Install [Docker](https://docs.docker.com/get-docker/)
* clone this repository with submodules: `git clone --recursive https://github.com/playmint/ds-example-building-extension.git`
* run `docker compose up --build` from your cloned repository folder
* ... will take a minuite or so to provision the game's services, then you should be able to use a browser to visit:
    * [http://localhost:3000](http://localhost:3000) to see the game's UI
    * [http://localhost:8080](http://localhost:8080) to see graphQL query playground
    
## Example of how to fork and make changes to the repository
* Install [Docker](https://docs.docker.com/get-docker/)
* Fork this repository
* In /contracts/src/Game.sol on line 81, change the name of the building from "MyDawnseekersExtension" to "Hello World"
* From the root of the repository, run 'docker compose up --build'
* ... will take a minuite or so to provision the game's services, then you should be able to use a browser to visit:
    * [http://localhost:3000](http://localhost:3000) to see the game's UI
* Collect enough resources to construct a building
* You will notice that you will be given the option to build the "Hello World" building


## Cleaning up

To delete the provisioned services:

```
docker compose down -v --rmi=all -t 1 --remove-orphans
```
