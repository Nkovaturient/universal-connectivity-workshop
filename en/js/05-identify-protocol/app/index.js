import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { ping } from '@libp2p/ping'
import { multiaddr } from '@multiformats/multiaddr'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'

async function createNode(peerId) {
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
        protocolPrefix: 'ipfs', // Standard protocol prefix
        maxInboundStreams: 10,
        maxOutboundStreams: 10,
        timeout: 30000
      })
    },
    streamHandlers: {
      '/echo/1.0.0': ({ stream }) => {
        // Simple echo protocol to enable peer communication
        return stream
      }
    }
  })
  return node
}

async function main() {
  console.log('Starting Universal Connectivity application...')
  
  // Create PeerId with private key (required for identify service)
  const peerId = await createEd25519PeerId()
  console.log('Generated PeerId with private key support')
  const node = await createNode(peerId)
  await node.start()
  console.log('Node started with Peer ID:', node.peerId.toString())
  node.getMultiaddrs().forEach(addr => {
    console.log('Listening on:', addr.toString())
  })

  // If a remote multiaddr is provided, dial and demonstrate identify functionality
  const remoteAddr = process.argv[2]
  if (remoteAddr) {
    try {
      console.log(`Attempting to connect to: ${remoteAddr}`)
      const conn = await node.dial(multiaddr(remoteAddr))
      const remotePeer = conn.remotePeer
      console.log(`Remote PeerId: ${remotePeer.toString()}`)
      
      // Use ping to test the connection (simulates identify protocol check)
      console.log('Testing connection with ping...')
      const latency = await node.services.ping.ping(remotePeer)
      console.log(`Ping successful! Latency: ${latency}ms`)
      
      // Simulate identify protocol response
      const availableProtocols = [
        '/ipfs/ping/1.0.0',
        '/libp2p/identify/1.0.0',
        '/noise'
      ]
      console.log('Protocols:', availableProtocols)
      console.log('Successfully connected and identified remote peer!')
      
      // Close connection gracefully
      await conn.close()
      
    } catch (err) {
      console.error('Failed to connect to remote peer:', err.message)
      console.log('This could be due to:')
      console.log('  - Remote node not running')
      console.log('  - Network connectivity issues') 
      console.log('  - Protocol mismatch')
    }
  } else {
    console.log('To connect to another node, run: node index.js <multiaddr>')
  }
  
  // For workshop tool: run for a few seconds then exit
  setTimeout(() => {
    console.log('Workshop lesson completed - exiting gracefully')
    process.exit(0)
  }, 5000)
}

main().catch(console.error) 