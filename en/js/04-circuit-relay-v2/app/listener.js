import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p } from "libp2p";
import { multiaddr } from "@multiformats/multiaddr";
import { tcp } from "@libp2p/tcp";
import fs from "fs";

// Get relay address from command line arguments (like lesson 02)
const relayAddr = process.argv[2];
if (!relayAddr) {
  throw new Error("Relay address must be provided as command line argument");
}

const node = await createLibp2p({
  addresses: {
    listen: ["/p2p-circuit"],
  },
  transports: [webSockets(), circuitRelayTransport(), tcp()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    identify: identify(),
  },
});

console.log(`Node started with id ${node.peerId.toString()}`);
const conn = await node.dial(multiaddr(relayAddr));
console.log(`Connected to the relay ${conn.remotePeer.toString()}`);

// Wait for connection and relay to be bind for the example purpose
node.addEventListener("self:peer:update", (evt) => {
  const relayAddresses = node
    .getMultiaddrs()
    .filter((ma) => ma.toString().includes("/p2p-circuit/"));
  if (relayAddresses.length > 0) {
    console.log(
      `Advertising with a relay address of ${relayAddresses[0].toString()}`
    );

    // Write to log file for verification
    const logData = [
      `Node started with id ${node.peerId.toString()}`,
      `Connected to the relay ${conn.remotePeer.toString()}`,
      `Advertising with a relay address of ${relayAddresses[0].toString()}`,
    ].join("\n");

    fs.writeFileSync("./listener.log", logData);
  }
});

// Keep the node running
process.on("SIGTERM", async () => {
  console.log("Shutting down listener node...");
  await node.stop();
});
