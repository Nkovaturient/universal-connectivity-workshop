import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { multiaddr } from "@multiformats/multiaddr";
import { webSockets } from "@libp2p/websockets";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";


const LISTENER_RELAY_ADDR = [
  multiaddr(
    "/ip4/127.0.0.1/tcp/39793/p2p/12D3KooWSsMnGwQi4jaEU6poS3o1EwUa5npLELvbMmWUJBL4QEaS/p2p-circuit/p2p/12D3KooWKpc6V9N6DYDXp4os6ViK96vc1ZXuATPiyL1Q5nFASbGP"
  ),
]; // e.g. /ip4/127.0.0.1/tcp/15003/p2p/<RelayPeerId>/p2p-circuit/p2p/<ListenerPeerId>

const main = async () => {
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
    await node.dial(LISTENER_RELAY_ADDR);
    console.log(
      `Connected to the listener node via ${LISTENER_RELAY_ADDR[0].toString()}`
    );
    console.log("DIAL SUCCESS");
  } catch (err) {
    console.error("Dial failed:", err);
  }
};
main();
