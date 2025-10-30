<<<<<<< HEAD
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import fs from 'fs';

const peerId = await createEd25519PeerId();

// Manually encode keys to Base64 to ensure inclusion
const peerIdJson = {
  id: peerId.toString(),
  privKey: peerId.privateKey && Buffer.from(peerId.privateKey).toString('base64'),
  pubKey: peerId.publicKey && Buffer.from(peerId.publicKey).toString('base64')
};

fs.writeFileSync('peer-id.json', JSON.stringify(peerIdJson, null, 2));

console.log('✅ Full peer-id.json saved with id, privKey, and pubKey');
=======
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import fs from 'fs'

const peerId = await createEd25519PeerId()

// Export in canonical JSON shape expected by createFromJSON
const peerIdJson = peerId.toJSON()

fs.writeFileSync('peer-id.json', JSON.stringify(peerIdJson, null, 2))

console.log('✅ peer-id.json saved (canonical JSON with privateKey/publicKey)')
>>>>>>> 3e8cd0582c49d8b80a97adf71c17a085697b704f
