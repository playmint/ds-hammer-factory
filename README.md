# A Factory That Makes Hammers (in Downstream)

## The starting point for your own Downstream Building
Documentation for how to ues this repository as the starting point for your own Downstream buildings can be found here: [Downstream - Developing a new building](https://github.com/playmint/ds/blob/main/docs/how-to/create-a-new-building.md)

## Deploy 
To deploy the HammerFactory directly (although we reccomend you follow the instructions above to make it your own first):

1. Choose a number from 1 to 9223372036854775807
    - **Write down this number. You’ll need it if you want to make changes to your building!**
2. From the command line type:

```
BUILDING_KIND_EXTENSION_ID=InsertYourID GAME_ADDRESS=0x1D8e3A7Dc250633C192AC1bC9D141E1f95C419AB forge script script/Deploy.sol --broadcast --verify --rpc-url "https://network-ds-test.dev.playmint.com"
```
