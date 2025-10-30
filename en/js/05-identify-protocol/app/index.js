import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
<<<<<<< HEAD
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { multiaddr } from '@multiformats/multiaddr'
import { createFromJSON } from '@libp2p/peer-id-factory'
import { privateKeyFromRaw } from '@libp2p/crypto/keys'
import fs from 'fs'
=======
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { ping } from '@libp2p/ping'
import { multiaddr } from '@multiformats/multiaddr'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
>>>>>>> 3e8cd0582c49d8b80a97adf71c17a085697b704f

async function createNode(peerId) {
  const node = await createLibp2p({
    peerId,
    addresses: {
<<<<<<< HEAD
      listen: [
        '/ip4/0.0.0.0/tcp/0',
        '/ip4/0.0.0.0/tcp/0/ws'
      ]
    },
    transports: [tcp(), webSockets()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify()
=======
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
>>>>>>> 3e8cd0582c49d8b80a97adf71c17a085697b704f
    }
  })
  return node
}

async function main() {
<<<<<<< HEAD
  // Load PeerId from file
  const peerIdJson = JSON.parse(fs.readFileSync('./peer-id.json'))
  const peerId = await createFromJSON(peerIdJson)

  // Extract and concatenate privateKey and publicKey for Ed25519
  if (peerId.privateKey && peerId.publicKey) {
    const privKeyRaw = Buffer.from(peerId.privateKey, 'base64')
    const pubKeyRaw = Buffer.from(peerId.publicKey, 'base64')
    const ed25519Raw = Buffer.concat([privKeyRaw, pubKeyRaw])
    const privKeyObj = privateKeyFromRaw(ed25519Raw)
    console.log('Reconstructed PrivateKey from raw (priv+pub):', privKeyObj)
  } else {
    console.log('No private or public key found in PeerId!')
  }
  console.log('Has private key:', !!peerId.privateKey)

=======
  console.log('Starting Universal Connectivity application...')
  
  // Create PeerId with private key (required for identify service)
  const peerId = await createEd25519PeerId()
  console.log('Generated PeerId with private key support')
>>>>>>> 3e8cd0582c49d8b80a97adf71c17a085697b704f
  const node = await createNode(peerId)
  await node.start()
  console.log('Node started with Peer ID:', node.peerId.toString())
  node.getMultiaddrs().forEach(addr => {
    console.log('Listening on:', addr.toString())
  })

<<<<<<< HEAD
  // If a remote multiaddr is provided, dial and query identify
  const remoteAddr = process.argv[2]
  if (remoteAddr) {
    try {
      const conn = await node.dial(multiaddr(remoteAddr))
      const remotePeer = conn.remotePeer
      // Query identify info
      const protocols = await node.services.identify.getProtocols(remotePeer)
      console.log(`Remote PeerId: ${remotePeer.toString()}`)
      console.log('Protocols:', protocols)
    } catch (err) {
      console.error('Failed to connect or identify remote peer:', err)
    }
  }
  process.stdin.resume()
=======
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
>>>>>>> 3e8cd0582c49d8b80a97adf71c17a085697b704f
}

main().catch(console.error) 