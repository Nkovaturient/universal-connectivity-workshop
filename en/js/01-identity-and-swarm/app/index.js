import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { ping } from '@libp2p/ping';

async function main() {
  console.log('Starting Universal Connectivity Application');

  const node = await createLibp2p({
    addresses: {
      listen: []
    },
    transports: [tcp()],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    services: {
      ping: ping()
    }
  });

  console.log(`Local peer id: ${node.peerId.toString()}`);
  
  const keepAliveMs = Number(process.env.KEEPALIVE_MS || '10000');
  await new Promise((resolve) => setTimeout(resolve, keepAliveMs));

  await node.stop();
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});