import {elrondPoolSeeds} from './env';
import {ApiPromise, WsProvider} from '@polkadot/api';
import {Header, EventRecord} from '@polkadot/types/interfaces';
import {typesBundleForPolkadot} from '@crustio/type-definitions';
import {Account, Address, Balance, GasLimit, Mnemonic, NetworkConfig, ChainID, ProxyProvider, Transaction, TransactionPayload, UserSecretKey, UserSigner} from "@elrondnetwork/erdjs/out";
import pseudoDB from './pseudo_db';
import BN from 'bn.js';

const crustEndpoint = 'wss://rpc.crust.network';
const elrondEndpoint = 'https://gateway.elrond.com';
const bridgeEventMethod = 'chainBridge.FungibleTransfer';
const bridgeEventCode = '100';
const elrondCRUIdentifier = '4352552d613566346161'
const mainnetToElrondUnit = "000000";
const elrondProviderTimeout = 30000;

function loadElrondPoolAccount(): string {
  const mnemonic = Mnemonic.fromString(elrondPoolSeeds)
  return mnemonic.deriveKey().hex();
}

async function bridgeHandler(crustProvider: ApiPromise, elrondProvider: ProxyProvider, h: Header) {
  let elrondReceipt: string | undefined = '';
  let crustSideAmount: string = '';
  let eventNonce: string = '';

  // 1. Parse event, try to get {dest, amount, eventNonce}
  const bn = h.number.toNumber();
  const bh = await crustProvider.rpc.chain.getBlockHash(bn);
  const ers: EventRecord[] = await crustProvider.query.system.events.at(bh);
  pseudoDB.info(`Got new block #${bn}(${bh})`);
  for (const {
    event: {section, data, method, index},
  } of ers) {  
    const eventMethod = `${section}.${method}`;
    if (bridgeEventMethod === eventMethod && bridgeEventCode === data[0].toHuman()) {
      crustSideAmount = data[3].toString();
      elrondReceipt = data[4].toHuman()?.toString();
      eventNonce = data[1].toString();
      // Add log with event {dest, amount, bn, bh, nonce}
      pseudoDB.info(`[NewTransfer] At #${bn}(${bh}), got new bridge transfer {receipt: ${elrondReceipt}, amount: ${crustSideAmount}, txNonce: ${eventNonce}, eventId: ${index.toHuman()}}`);
    }
  }

  // 2. Transfer on Elrond side
  if (crustSideAmount !== '') {
    const elrondPoolSigner = new UserSigner(UserSecretKey.fromString(loadElrondPoolAccount()));
    const elrondSideRawAmount = crustSideAmount + mainnetToElrondUnit;
    const elrondSideAmountHex = new BN(elrondSideRawAmount).toString(16);
    const elrondSideAmount = elrondSideAmountHex.length % 2 == 0 ? elrondSideAmountHex : '0' + elrondSideAmountHex
    const elrondPool = new Account(elrondPoolSigner.getAddress());
    await elrondPool.sync(elrondProvider);

    let tx = new Transaction({
      chainID: new ChainID('1'),
      nonce: elrondPool.nonce,
      gasLimit: new GasLimit(500000),
      receiver: new Address(elrondReceipt),
      value: Balance.egld(0),
      data: new TransactionPayload(`ESDTTransfer@${elrondCRUIdentifier}@${elrondSideAmount}`) 
    });

    try {
        NetworkConfig.getDefault().sync(elrondProvider);
    } catch (error) {
        console.error(error);
    }

    await elrondPoolSigner.sign(tx);

    try {
      const txRst = await tx.send(elrondProvider); // Will return result around 15s
      const txHash = Buffer.from(txRst.hash.valueOf()).toString('hex');
      pseudoDB.info(`[TransferSuccess] At #${bn}(${bh}), bridge transfer success {receipt: ${elrondReceipt}, amount: ${elrondSideAmount}, txHash: ${txHash}}`);
    } catch (error: any) {
      // Do nothing here, we'll query it anyway
    }
  }

  // TDOO: Write to log(failed to error, success to info level)
}

const main = async () => {
  // 1. Create Crust mainnet instance
  const crustProvider = new ApiPromise({
    provider: new WsProvider(crustEndpoint),
    typesBundle: typesBundleForPolkadot,
  });
  // 2. Create Elrond mainnet instance
  const elrondProvider = new ProxyProvider(elrondEndpoint, { timeout: elrondProviderTimeout });

  // 3. Listen bridge event on Crust mainnet
  await crustProvider.isReadyOrError;
  await crustProvider.rpc.chain.subscribeFinalizedHeads(async (head: Header) => {
    await bridgeHandler(crustProvider, elrondProvider, head)
  });
};

main();
