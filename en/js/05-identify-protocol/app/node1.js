/**
 * Node1: Listener Node
 * 
 * This node starts first, listens for incoming connections, and demonstrates
 * the Identify protocol by responding to identify requests.
 */

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { ping } from '@libp2p/ping';
import { identify } from '@libp2p/identify';
import { createFromJSON } from '@libp2p/peer-id-factory';
import fs from 'fs';

const AGENT_VERSION = 'universal-connectivity/0.1.0';

async function main() {
  console.log('=== Node1: Starting Listener Node ===');
  
  // Load persistent peer ID
  let peerId;
  try {
    const peerIdJson = JSON.parse(fs.readFileSync('./peer-id-node1.json', 'utf-8'));
    peerId = await createFromJSON(peerIdJson);
  } catch (err) {
    console.error('Failed to load peer-id-node1.json:', err);
    process.exit(1);
  }

  const node = await createLibp2p({
    peerId,
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/9092']
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

  console.log(`Node1 started with id: ${node.peerId.toString()}`);
  console.log('Node1 listening on:');
  const addrs = node.getMultiaddrs();
  addrs.forEach((addr) => {
    console.log(`  ${addr.toString()}`);
  });
  console.log(`Node1 ready to accept connections. Node2 will discover my address via Identify protocol.`);

  // Track identify completion for ping coordination
  const identifiedPeers = new Map();

  node.addEventListener('peer:connect', (event) => {
    const peerId = event.detail.toString();
    console.log(`[IDENTIFY] Node1: Incoming connection from ${peerId}`);
  });

  // Event: Peer identified (Identify protocol exchange)
  node.addEventListener('peer:identify', async (event) => {
    const { detail } = event;
    const peerId = detail.peerId.toString();
    const protocols = detail.protocols || [];
    const listenAddrs = detail.listenAddrs || [];
    
    console.log(`[IDENTIFY] Node1: Identified peer ${peerId}`);
    console.log(`[IDENTIFY] Node1: Peer agent: ${detail.agentVersion || AGENT_VERSION}`);
    console.log(`[IDENTIFY] Node1: Peer supports ${protocols.length} protocols`);
    console.log(`[IDENTIFY] Node1: Protocols: ${protocols.join(', ')}`);
    console.log(`[IDENTIFY] Node1: Node2's dynamically discovered listening addresses (${listenAddrs.length}):`);
    listenAddrs.forEach((addr, i) => {
      console.log(`[IDENTIFY] Node1:   ${i + 1}. ${addr.toString()}`);
    });
    
    // Mark as identified
    identifiedPeers.set(peerId, detail);
    
    // Ping the peer after identify exchange
    console.log(`[PING] Node1: Pinging ${peerId}...`);
    try {
      const rtt = await node.services.ping.ping(detail.peerId);
      console.log(`[PING] Node1: Ping to ${peerId} successful, RTT: ${rtt} ms`);
    } catch (err) {
      console.log(`[PING] Node1: Ping to ${peerId} failed: ${err.message}`);
    }
  });

  // Event: Connection closed
  node.addEventListener('peer:disconnect', (event) => {
    const peerId = event.detail.toString();
    console.log(`[IDENTIFY] Node1: Connection to ${peerId} closed`);
    identifiedPeers.delete(peerId);
  });

  const keepAliveMs = Number(process.env.KEEPALIVE_MS || '30000');
  await new Promise((resolve) => setTimeout(resolve, keepAliveMs));

  await node.stop();
  console.log('Node1 stopped');
}

main().catch((err) => {
  console.error('Node1 error:', err?.message ?? err);
  process.exit(1);
});

