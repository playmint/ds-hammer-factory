# A Factory That Makes Hammers (in Dawnseekers)

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

Deploy the BuildingKind extension and plugin, substituting the correct game id you found above:

```
GAME_ADDRESS=0x1D8e3A7Dc250633C192AC1bC9D141E1f95C419AB forge script script/Deploy.sol --broadcast --verify --rpc-url "http://localhost:8545"
```
