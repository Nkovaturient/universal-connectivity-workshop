import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { ping } from '@libp2p/ping';
import { identify } from '@libp2p/identify';
import { multiaddr } from '@multiformats/multiaddr';

async function main() {
  console.log('Starting Universal Connectivity Application...');

  // Parse remote peer addresses from environment variable
  let remoteAddrs = [];
  if (process.env.REMOTE_PEERS) {
    remoteAddrs = process.env.REMOTE_PEERS
      .split(',')                          
      .map(s => s.trim())                  
      .filter(s => s.length > 0)          
      .map(s => multiaddr(s));             
  }

  const node = await createLibp2p({
    addresses: {
      listen: []
    },
    transports: [tcp()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      ping: ping(),
      identify: identify()
    }
  });

  await node.start();

  console.log(`Local peer id: ${node.peerId.toString()}`);

  // Set up event handlers BEFORE dialing
  node.addEventListener('connection:open', (evt) => {
    const conn = evt.detail;
    const peerId = conn.remotePeer.toString();
    const remoteAddr = conn.remoteAddr.toString();
    console.log(`Connected to: ${peerId} via ${remoteAddr}`);
  });

  node.addEventListener('connection:close', (evt) => {
    const conn = evt.detail;
    const peerId = conn.remotePeer.toString();
    console.log(`Connection to ${peerId} closed gracefully`);
  });

  for (const addr of remoteAddrs) {
    try {
      const conn = await node.dial(addr);
      // Connection is established - events will fire via connection:open
    } catch (err) {
      console.log(`Failed to connect to ${addr.toString()}: ${err.message}`);
    }
  }

  // Keep the process alive to allow connections to establish and close
  const timeoutMs = process.env.TIMEOUT_DURATION 
    ? Number(process.env.TIMEOUT_DURATION.replace('s', '')) * 1000
    : 20000;
  
  await new Promise((resolve) => setTimeout(resolve, timeoutMs));

  await node.stop();
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
