import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { multiaddr } from "@multiformats/multiaddr";
import { webSockets } from "@libp2p/websockets";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import fs from "fs";

// Get listener relay address from command line arguments (like lesson 02)
const LISTENER_RELAY_ADDR = process.argv[2];
if (!LISTENER_RELAY_ADDR) {
  throw new Error(
    "Listener relay address must be provided as command line argument"
  );
}

const main = async () => {
  try {
    const node = await createLibp2p({
      addresses: { listen: [] },
      transports: [tcp(), webSockets(), circuitRelayTransport()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        identify: identify(),
      },
    });

    await node.start();
    console.log(`Node started with id ${node.peerId.toString()}`);

    try {
      await node.dial(multiaddr(LISTENER_RELAY_ADDR));
      console.log(`Connected to the listener node via ${LISTENER_RELAY_ADDR}`);
      console.log("DIAL SUCCESS");

      // Write to log file for verification
      const logData = [
        `Node started with id ${node.peerId.toString()}`,
        `Connected to the listener node via ${LISTENER_RELAY_ADDR}`,
        "DIAL SUCCESS",
      ].join("\n");

      fs.writeFileSync("./dialer.log", logData);
    } catch (err) {
      console.error("Dial failed:", err);
      const logData = [
        `Node started with id ${node.peerId.toString()}`,
        `Dial failed: ${err.message}`,
      ].join("\n");

      fs.writeFileSync("./dialer.log", logData);
      process.exit(1);
    }

    // Keep node running briefly to maintain connection
    setTimeout(async () => {
      console.log("Shutting down dialer node...");
      await node.stop();
    }, 5000);
  } catch (err) {
    console.error("Dialer setup failed:", err);
    process.exit(1);
  }
};

main().catch(console.error);
