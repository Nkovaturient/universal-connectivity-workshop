# Lesson 5: Identify Protocol (Checkpoint 2)

Welcome to Checkpoint 2! In this lesson, you'll implement the identify protocol in js-libp2p, connect to a remote peer, and extract its PeerId and supported protocols.

## Objective
- Implement the identify protocol for peer capability discovery
- Connect to a remote peer and extract its PeerId and supported protocols

---

## Step-by-Step Instructions

1. **Install Dependencies**
   (If you haven't already, run:)
   ```sh
   npm install
   ```

2. **Generate Your PeerId**
   Run the following command in your app directory:
   ```sh
   node generate-peer-id.js
   ```
   This will create a `peer-id.json` file required for your node.

3. **Update Your Node Setup**
   - The `app/index.js` file has been pre-configured with a working libp2p node
   - Review the code to understand the following key components:
     * PeerId generation with private key support
     * TCP transport with Noise encryption and Yamux multiplexing
     * Ping service for basic peer communication
     * Echo protocol for connection testing
   
   Key features of the implementation:
   ```js
   // Uses createEd25519PeerId() for proper key generation
   const peerId = await createEd25519PeerId()
   
   // Configures essential libp2p services
   services: {
     ping: ping({
       protocolPrefix: 'ipfs',
       maxInboundStreams: 10,
       maxOutboundStreams: 10,
       timeout: 30000
     })
   }
   
   // Includes stream handler for peer communication
   streamHandlers: {
     '/echo/1.0.0': ({ stream }) => stream
   }
   ```

4. **Testing with Workshop Tool**
   If you are using the workshop tool, simply press `c` to check your solution.
   
   **Manual Testing (Advanced Users)**:
   
   For manual testing, you'll need to set environment variables and use Docker Compose:
   
   ```bash
   # Set environment variables
   export PROJECT_ROOT=/path/to/workshop
   export LESSON_PATH=en/js/05-identify-protocol
   export TIMEOUT_DURATION=30s
   
   # Change to lesson directory
   cd $PROJECT_ROOT/$LESSON_PATH
   
   # Create external network (if not exists)
   docker network create --driver bridge --subnet 172.16.16.0/24 workshop-net || true
   
   # Run with Docker Compose
   docker compose --project-name workshop up --build --remove-orphans
   
   # Check output
   python check.py
   ```
   
   **Expected Output**: 
   - "Node started with Peer ID: 12D3KooW..."
   - "Listening on: /ip4/..." addresses

---

## Hints

<details>
<summary>Hint 1: How does peer identification work in this lesson?</summary>
This lesson uses the ping service to establish basic peer communication and connection testing. The PeerId is automatically exchanged during the connection handshake.
</details>

<details>
<summary>Hint 2: How do I connect to a remote peer?</summary>
Use `node.dial(multiaddr(remoteAddr))` where `remoteAddr` is a string like "/ip4/127.0.0.1/tcp/12345".
</details>

<details>
<summary>Hint 3: What if connection fails?</summary>
Check that both nodes are running, the multiaddr is correct, and there are no firewall issues. The code includes helpful error messages.
</details>

<details>
<summary>Hint 4: Understanding the output</summary>
Look for "Node started with Peer ID:" and "Listening on:" in the output. For connections, you should see ping latency and protocol information.
</details>

---

## Resources
- [js-libp2p Getting Started Guide](https://docs.libp2p.io/guides/getting-started/javascript)
- [js-libp2p API Docs](https://libp2p.github.io/js-libp2p/)
- [js-libp2p Identify Service](https://libp2p.github.io/js-libp2p/modules/_libp2p_identify.html)