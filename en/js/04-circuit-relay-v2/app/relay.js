import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import { tcp } from "@libp2p/tcp";
import { createLibp2p } from "libp2p";
import { keys } from "@libp2p/crypto";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import fs from "fs";

async function createNode() {
  const json = JSON.parse(fs.readFileSync("./peer-id.json", "utf8"));
  const privateKey = keys.privateKeyFromProtobuf(
    Buffer.from(json.privKey, "base64")
  );
  const derivedPeerId = peerIdFromPrivateKey(privateKey);
  console.log("PeerId:", derivedPeerId.toString());

  const node = await createLibp2p({
    privateKey,
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/4001", "/ip4/0.0.0.0/tcp/4002/ws"],
    },
    transports: [tcp(), webSockets()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      relay: circuitRelayServer({ reservations: 15 }),
    },
  });
  return node;
}

async function main() {
  const node = await createNode();

  await node.start();
  node.addEventListener("error", (evt) => {
    console.error("Node error:", evt.detail);
  });

  console.log(`relay,${node.peerId.toString()},started`);

  const multiaddrs = node.getMultiaddrs();
  multiaddrs.forEach((ma) => {
    console.log(`relay,${ma.toString()},listening`);
  });

  // Write to relay.log for verification
  const logData = [
    `PeerId: ${node.peerId.toString()}`,
    `Node started with id ${node.peerId.toString()}`,
    "Listening on:",
    ...multiaddrs.map((ma) => ma.toString()),
  ].join("\n");

  fs.writeFileSync("./relay.log", logData);

  // Keep the node running
  process.on("SIGTERM", async () => {
    console.log("Shutting down relay node...");
    await node.stop();
  });
}

main().catch(console.error);
