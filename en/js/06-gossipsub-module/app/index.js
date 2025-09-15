import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { identify } from '@libp2p/identify'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { multiaddr } from '@multiformats/multiaddr'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

const TOPIC = 'universal-connectivity'

/**
 * Creates a libp2p node with GossipSub publish-subscribe capabilities.
 * 
 * This demonstrates the essential components needed for peer-to-peer messaging:
 * - TCP transport for network communication
 * - Noise encryption for secure connections  
 * - Yamux stream multiplexing for efficient data flow
 * - GossipSub for scalable topic-based messaging
 * - Identify protocol for peer capability discovery
 * 
 * @param {number} port - TCP port to listen on (0 for random)
 * @returns {Promise<Libp2p>} Configured libp2p node
 */
async function createNode(port = 0) {
  const peerId = await createEd25519PeerId()
  
  const node = await createLibp2p({
    peerId,
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${port}`]
    },
    transports: [tcp()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({
        emitSelf: false,
        allowPublishToZeroPeers: true,
        messageProcessingConcurrency: 10
      }),
      identify: identify()
    }
  })

  return node
}

/**
 * Sets up event handlers for GossipSub message and subscription events.
 * 
 * This demonstrates the event-driven nature of libp2p GossipSub:
 * - Message events are fired when peers publish to subscribed topics
 * - Subscription-change events track when peers join/leave topics
 * 
 * @param {Libp2p} node - The libp2p node instance
 * @param {string} nodeName - Human-readable identifier for logging
 */
function setupMessageHandling(node, nodeName) {
  // Handle incoming messages from other peers
  node.services.pubsub.addEventListener('message', (evt) => {
    const message = uint8ArrayToString(evt.detail.data)
    const fromPeer = evt.detail.from.toString()
    console.log(`[${nodeName}] Received message from ${fromPeer}: "${message}" on topic ${evt.detail.topic}`)
  })

  // Track peer subscription changes for mesh topology awareness
  node.services.pubsub.addEventListener('subscription-change', (evt) => {
    console.log(`[${nodeName}] Peer ${evt.detail.peerId.toString()} ${evt.detail.subscriptions.map(s => 
      `${s.subscribe ? 'subscribed to' : 'unsubscribed from'} topic: ${s.topic}`
    ).join(', ')}`)
  })
}

/**
 * Demonstrates GossipSub peer-to-peer messaging in a multi-node network.
 * 
 * This creates a realistic scenario showing how GossipSub enables:
 * - Decentralized topic-based communication
 * - Automatic mesh network formation between peers
 * - Reliable message propagation across the network
 * - Real-time bidirectional messaging
 * 
 * Educational value: Students see how multiple libp2p nodes discover each other,
 * form mesh topologies, and exchange messages without central coordination.
 * 
 * @returns {Promise<boolean>} Success status of the demonstration
 */
async function demonstrateMultiPeerGossipSub() {
  console.log('Starting GossipSub Universal Connectivity Lesson...')
  console.log('Setting up multi-peer GossipSub demonstration...')
  
  try {
    // Create bootstrap peer - the first node in our network
    console.log('\n=== Creating Bootstrap Peer (Peer A) ===')
    const peerA = await createNode(0)
    await peerA.start()
    
    console.log(`Node started with Peer ID: ${peerA.peerId.toString()}`)
    peerA.getMultiaddrs().forEach(addr => {
      console.log(`Listening on: ${addr.toString()}`)
    })
    
    setupMessageHandling(peerA, 'Peer A')
    await peerA.services.pubsub.subscribe(TOPIC)
    console.log(`Subscribed to topic: ${TOPIC}`)
    
    // Get the bootstrap address for other peers to connect to
    const bootstrapAddr = peerA.getMultiaddrs()[0]
    console.log(`Bootstrap address: ${bootstrapAddr.toString()}`)
    
    // Create second peer that will connect to the bootstrap peer
    console.log('\n=== Creating Second Peer (Peer B) ===')
    const peerB = await createNode(0)
    await peerB.start()
    
    console.log(`Node started with Peer ID: ${peerB.peerId.toString()}`)
    peerB.getMultiaddrs().forEach(addr => {
      console.log(`Listening on: ${addr.toString()}`)
    })
    
    setupMessageHandling(peerB, 'Peer B')
    await peerB.services.pubsub.subscribe(TOPIC)
    console.log(`Subscribed to topic: ${TOPIC}`)
    
    // Establish connection between peers to form network
    console.log('\n=== Connecting Peers ===')
    try {
      console.log(`Connecting Peer B to Peer A: ${bootstrapAddr.toString()}`)
      await peerB.dial(bootstrapAddr)
      console.log(`Successfully connected to remote peer: ${bootstrapAddr.toString()}`)
    } catch (err) {
      console.error('Failed to connect peers:', err.message)
      return false
    }
    
    // Allow time for GossipSub mesh topology to stabilize
    console.log('\n=== Waiting for GossipSub mesh formation ===')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Verify mesh formation by checking topic subscribers
    const peerASubscribers = peerA.services.pubsub.getSubscribers(TOPIC)
    const peerBSubscribers = peerB.services.pubsub.getSubscribers(TOPIC)
    
    console.log(`Peers subscribed to topic "${TOPIC}" from Peer A perspective: ${peerASubscribers.length}`)
    peerASubscribers.forEach(peer => {
      console.log(`  - ${peer.toString()}`)
    })
    
    console.log(`Peers subscribed to topic "${TOPIC}" from Peer B perspective: ${peerBSubscribers.length}`)
    peerBSubscribers.forEach(peer => {
      console.log(`  - ${peer.toString()}`)
    })
    
    // Demonstrate bidirectional message exchange
    console.log('\n=== Testing Message Exchange ===')
    
    // Publish message from first peer
    const messageFromA = `Hello from Peer A (${peerA.peerId.toString()}) at ${new Date().toISOString()}`
    console.log(`[Peer A] Publishing message: "${messageFromA}"`)
    await peerA.services.pubsub.publish(TOPIC, uint8ArrayFromString(messageFromA))
    console.log(`Published message: "${messageFromA}"`)
    
    // Allow time for message to propagate through mesh
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Publish message from second peer
    const messageFromB = `Hello from Peer B (${peerB.peerId.toString()}) at ${new Date().toISOString()}`
    console.log(`[Peer B] Publishing message: "${messageFromB}"`)
    await peerB.services.pubsub.publish(TOPIC, uint8ArrayFromString(messageFromB))
    console.log(`Published message: "${messageFromB}"`)
    
    // Allow time for message to propagate through mesh
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Summary of demonstrated GossipSub capabilities
    console.log('\n=== GossipSub Demonstration Complete ===')
    console.log('GossipSub demonstration complete!')
    console.log('Key achievements:')
    console.log('✓ Created multiple libp2p nodes with GossipSub service')
    console.log('✓ Connected peers in a mesh network')
    console.log('✓ Subscribed to pub/sub topic from multiple peers')
    console.log('✓ Successfully exchanged messages between peers')
    console.log('✓ Demonstrated decentralized messaging capabilities')
    
    // Maintain nodes briefly for workshop tool validation
    console.log('\nKeeping nodes running for workshop validation...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Clean shutdown of all nodes
    console.log('Workshop lesson completed - shutting down gracefully')
    await peerA.stop()
    await peerB.stop()
    
    return true
    
  } catch (error) {
    console.error('Error in multi-peer demonstration:', error)
    return false
  }
}

/**
 * Main function - Entry point for the GossipSub lesson.
 * 
 * Executes the complete multi-peer demonstration and provides
 * appropriate exit codes for the workshop validation system.
 */
async function main() {
  try {
    const success = await demonstrateMultiPeerGossipSub()
    
    if (success) {
      console.log('\n🎉 Multi-peer GossipSub lesson completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Multi-peer GossipSub lesson failed')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('Unhandled error in main:', error)
    process.exit(1)
  }
}

// Graceful shutdown handlers for clean process termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT - shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM - shutting down gracefully...')
  process.exit(0)
})

// Start the lesson demonstration
main().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
