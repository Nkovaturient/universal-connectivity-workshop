import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import fs from "fs";
const peerId = await createEd25519PeerId();
const peerIdData = {
  id: peerId.toString(),
  privateKey: peerId.privateKey,
  publicKey: peerId.publicKey,
  type: peerId.type,
};
fs.writeFileSync("./peer-id.json", JSON.stringify(peerIdData, null, 2));
console.log("✅ Peer ID saved to peer-id.json using simplified approach");
