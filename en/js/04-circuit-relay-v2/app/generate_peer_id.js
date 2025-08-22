// // generate-peer-id.js
// import { createEd25519PeerId } from '@libp2p/peer-id-factory'
// import fs from 'fs'

// const peerId = await createEd25519PeerId()
// fs.writeFileSync('./peer-id.json', JSON.stringify(peerId.toJSON(), null, 2))
// console.log('Peer ID saved to peer-id.json')
// //

import fs from "fs";
import { keys } from "@libp2p/crypto";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";

// Generate a new Ed25519 private key
const privateKey = await keys.generateKeyPair("Ed25519");

// Derive PeerId from the private key (v5 API)
const peerId = peerIdFromPrivateKey(privateKey);

// Serialize keys to protobuf and base64-encode for storage
const privKeyProto = keys.privateKeyToProtobuf(privateKey);
const pubKeyProto = keys.publicKeyToProtobuf(privateKey.publicKey);

const peerIdJson = {
  id: peerId.toString(),
  privKey: Buffer.from(privKeyProto).toString("base64"),
  pubKey: Buffer.from(pubKeyProto).toString("base64"),
};

fs.writeFileSync("peer-id.json", JSON.stringify(peerIdJson, null, 2));

console.log("✅ Full peer-id.json saved with id, privKey, and pubKey");
