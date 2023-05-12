# A Factory That Makes Hammers (in Dawnseekers)

## Getting started

This is a forge project, ([install foundry](https://book.getfoundry.sh/getting-started/installation))

Once you have foundry, you should be able to run the tests:

```
forge test
```

inside the `src` dir you will find two files:

* HammerFactory.sol - this is a BuildingKind Extension, Players can call your `use` function by visiting instances of the BuildingKind on the map
* HammerFactory.js - this is a client plugin that will be loaded when Players visit instance of the BuildingKind, use it to show UI for calling the `use` function

## How to deploy

Find the address of the game contract....

Visit http://localhost:8080/ and execute this query:

```
query {
  game(id: "DAWNSEEKERS") {
    id
  }
}
```

The returned `id` is the game address.

Deploy the BuildingKind extension and plugin, substituting the correct value for the `GAME_ADDRESS` you found above, and picking a number between 1 and 9223372036854775807 to be your `BUILDING_KIND_EXTENSION_ID`:

```
BUILDING_KIND_EXTENSION_ID=45342312 GAME_ADDRESS=0x1D8e3A7Dc250633C192AC1bC9D141E1f95C419AB forge script script/Deploy.sol --broadcast --verify --rpc-url "http://localhost:8545"
```
