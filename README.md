# Elrond Bridge
Hot service from Crust Mainnet to Elrond

## Des
The whole service will be like below:

```
1. Long running mainnnet event listener
2. event -> parse
3. {dest, amount} -> new Transaction
❌ 4. A1 = old account amount
5. transfer
❌ 6. A2 = new account amount
7. update db with {mainnet_nonce, success/failed, amount, dest, elrond_tx_hash(if success)}

For 7*, Temporarily write into log file
```
