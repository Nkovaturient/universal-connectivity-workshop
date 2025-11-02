/**
 * Node2: Dialer Node
 * 
 * This node starts after Node1, dials Node1 using its known Docker network address,
 * uses Identify protocol to dynamically discover Node1's listening addresses and capabilities, and pings it.
 */

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { ping } from '@libp2p/ping';
import { identify } from '@libp2p/identify';
import { createFromJSON } from '@libp2p/peer-id-factory';
import { multiaddr } from '@multiformats/multiaddr';
import fs from 'fs';


const AGENT_VERSION = 'universal-connectivity/0.1.0';

async function main() {
  console.log('=== Node2: Starting Dialer Node ===');
  
  // Load persistent peer ID
  let peerId;
  try {
    const peerIdJson = JSON.parse(fs.readFileSync('./peer-id-node2.json', 'utf-8'));
    peerId = await createFromJSON(peerIdJson);
  } catch (err) {
    console.error('Failed to load peer-id-node2.json:', err);
    process.exit(1);
  }

  const node = await createLibp2p({
    peerId,
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0']
    },
    transports: [tcp()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      ping: ping({
        protocolPrefix: 'ipfs',
        timeout: 5000
      }),
      identify: identify({
        protocolPrefix: 'ipfs',
        agentVersion: AGENT_VERSION
      })
    }
  });

  await node.start();

  console.log(`Node2 started with id: ${node.peerId.toString()}`);
  console.log('Node2 listening on:');
  const node2Addrs = node.getMultiaddrs();
  node2Addrs.forEach((addr) => {
    console.log(`  ${addr.toString()}`);
  });

  // Track identify completion for ping coordination
  const identifiedPeers = new Map();

  // Event: Connection established
  node.addEventListener('peer:connect', (event) => {
    const peerId = event.detail.toString();
    console.log(`[IDENTIFY] Node2: Connected to ${peerId}`);
  });

  // Event: Peer identified (Identify protocol exchange)
  node.addEventListener('peer:identify', async (event) => {
    const { detail } = event;
    const peerId = detail.peerId.toString();
    const protocols = detail.protocols || [];
    const listenAddrs = detail.listenAddrs || [];
    
    console.log(`[IDENTIFY] Node2: Identified peer ${peerId}`);
    console.log(`[IDENTIFY] Node2: Peer agent: ${detail.agentVersion || AGENT_VERSION}`);
    console.log(`[IDENTIFY] Node2: Peer supports ${protocols.length} protocols`);
    console.log(`[IDENTIFY] Node2: Protocols: ${protocols.join(', ')}`);
    console.log(`[IDENTIFY] Node2: Node1's dynamically discovered listening addresses (${listenAddrs.length}):`);
    listenAddrs.forEach((addr, i) => {
      console.log(`[IDENTIFY] Node2:   ${i + 1}. ${addr.toString()}`);
    });
    
    // Mark as identified
    identifiedPeers.set(peerId, detail);
    
    // Ping the peer after identify exchange
    console.log(`[PING] Node2: Pinging ${peerId}...`);
    try {
      const rtt = await node.services.ping.ping(detail.peerId);
      console.log(`[PING] Node2: Ping to ${peerId} successful, RTT: ${rtt} ms`);
    } catch (err) {
      console.log(`[PING] Node2: Ping to ${peerId} failed: ${err.message}`);
    }
  });

  // Event: Connection closed
  node.addEventListener('peer:disconnect', (event) => {
    const peerId = event.detail.toString();
    console.log(`[IDENTIFY] Node2: Connection to ${peerId} closed`);
    identifiedPeers.delete(peerId);
  });

  // Step 1: Dial Node1 using configurable address
  // In Docker: NODE1_ADDR=/ip4/172.16.16.16/tcp/9092 (from docker-compose)
  // Locally: NODE1_ADDR=/ip4/127.0.0.1/tcp/9092 (default)
  // After connection, we'll discover Node1's full listening addresses via Identify protocol
  const node1NetworkAddr = process.env.NODE1_ADDR || '/ip4/127.0.0.1/tcp/9092';
  const node1Addr = multiaddr(node1NetworkAddr);
  
  console.log(`[IDENTIFY] Node2: Dialing Node1 at ${node1Addr.toString()}...`);
  console.log(`[IDENTIFY] Node2: Connecting to ${node1Addr.toString()}`);
  const conn = await node.dial(node1Addr);
  const node1Peer = conn.remotePeer;
  console.log(`[IDENTIFY] Node2: Connected to Node1 (Peer ID: ${node1Peer.toString()})`);

  // Step 2: Identify protocol runs automatically on connection open
  // Wait for identify exchange to complete (both directions)
  console.log('[IDENTIFY] Node2: Waiting for identify exchange...');
  let attempts = 0;
  while (!identifiedPeers.has(node1Peer.toString()) && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    attempts++;
  }

  if (identifiedPeers.has(node1Peer.toString())) {
    console.log('[IDENTIFY] Node2: Identify exchange completed successfully');
  } else {
    console.log('[IDENTIFY] Node2: Identify exchange may still be in progress');
  }

  const keepAliveMs = Number(process.env.KEEPALIVE_MS || '10000');
  await new Promise((resolve) => setTimeout(resolve, keepAliveMs));

  await node.stop();
  console.log('Node2 stopped');
}

main().catch((err) => {
  console.error('Node2 error:', err?.message ?? err);
  process.exit(1);
});