## Contracts


## Create CoW AMM

Requires foundry installation

```bash
token0=0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb
token1=0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f
minTradedToken0=10000000000000000
priceOracle=0x9634CA647474B6B78D3382331a77cd00a8a940Da
priceOracleData=0x000000
appData=0x0000000000000000000000000000000000000000000000000000000000000000
cast abi-encode 'f((address,address,uint256,address,bytes,bytes32))' "($token0, $token1, $minTradedToken0, $priceOracle, $priceOracleData, $appData)"
```