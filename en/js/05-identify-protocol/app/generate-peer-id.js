import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import fs from 'fs'

const peerId = await createEd25519PeerId()

// Export in canonical JSON shape expected by createFromJSON
const peerIdJson = peerId.toJSON()

fs.writeFileSync('peer-id.json', JSON.stringify(peerIdJson, null, 2))

console.log('✅ peer-id.json saved (canonical JSON with privateKey/publicKey)')