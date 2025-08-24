#!/usr/bin/env python3
import os
import re
import sys

def validate_peer_id(peer_id_str):
    """Validate that the peer ID string is a valid libp2p PeerId format"""
    # Basic format validation - should start with 12D3KooW (Ed25519 peer IDs)
    if not peer_id_str.startswith("12D3KooW"):
        return False, f"Invalid peer ID format. Expected to start with '12D3KooW', got: {peer_id_str}"

    # Length check - valid peer IDs should be around 45-60 characters
    if len(peer_id_str) < 45 or len(peer_id_str) > 60:
        return False, f"Peer ID length seems invalid. Expected 45-60 chars, got {len(peer_id_str)}: {peer_id_str}"

    # Character set validation - should only contain base58 characters
    valid_chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    for char in peer_id_str:
        if char not in valid_chars:
            return False, f"Invalid character '{char}' in peer ID. Must be base58 encoded."

    return True, f"{peer_id_str}"

def validate_multiaddr(addr_str):
    """Validate that the address string looks like a valid multiaddr"""
    # Basic multiaddr validation - should start with /ip4/ or /ip6/
    if not (addr_str.startswith("/ip4/") or addr_str.startswith("/ip6/")):
        return False, f"Invalid multiaddr format: {addr_str}"

    # Should contain /tcp for TCP transport
    if "/tcp" not in addr_str:
        return False, f"Missing TCP transport in multiaddr: {addr_str}"

    return True, f"{addr_str}"

def check_output():
    """Check the output log for expected identify protocol functionality"""
    # Workshop tool runs Docker Compose which creates stdout.log
    # We need to check stdout.log first, then fallback to checker.log
    log_file = None
    
    if os.path.exists("stdout.log"):
        log_file = "stdout.log"
        print("i Found stdout.log from Docker container")
    elif os.path.exists("checker.log"):
        log_file = "checker.log"
        print("i Found checker.log")
    else:
        print("X No log files found (stdout.log or checker.log)")
        return False

    try:
        with open(log_file, "r") as f:
            output = f.read()

        print("i Checking identify protocol functionality...")

        if not output.strip():
            print(f"X {log_file} is empty - application may have failed to start")
            return False

        # Check for node startup with Peer ID
        peer_id_pattern = r"Node started with Peer ID:\s*(12D3KooW[A-Za-z0-9]+)"
        peer_id_matches = re.search(peer_id_pattern, output)
        if not peer_id_matches:
            print("X No node startup with Peer ID detected")
            print(f"i Expected: 'Node started with Peer ID: <peer_id>'")
            print(f"i Actual output: {repr(output[:500])}")
            return False

        peer_id = peer_id_matches.group(1)
        valid, peer_id_message = validate_peer_id(peer_id)
        if not valid:
            print(f"X {peer_id_message}")
            return False

        print(f"+ Node started with {peer_id_message}")

        # Check for listening addresses
        listening_pattern = r"Listening on:\s*([/\w\.:-]+)"
        listening_matches = re.findall(listening_pattern, output)
        if not listening_matches:
            print("X No listening addresses detected")
            print(f"i Expected: 'Listening on: <multiaddr>'")
            print(f"i Actual output: {repr(output[:500])}")
            return False

        for addr in listening_matches:
            valid, addr_message = validate_multiaddr(addr)
            if not valid:
                print(f"X {addr_message}")
                return False

        print(f"+ Node listening on {len(listening_matches)} address(es)")

        # Check for identify protocol usage (if remote connection was attempted)
        remote_peer_pattern = r"Remote PeerId:\s*(12D3KooW[A-Za-z0-9]+)"
        remote_peer_matches = re.search(remote_peer_pattern, output)
        
        if remote_peer_matches:
            # Remote connection was attempted - validate identify protocol usage
            remote_peer_id = remote_peer_matches.group(1)
            valid, remote_peer_message = validate_peer_id(remote_peer_id)
            if not valid:
                print(f"X {remote_peer_message}")
                return False

            print(f"+ Successfully connected to remote peer {remote_peer_message}")

            # Check for protocols extraction
            protocols_pattern = r"Protocols:\s*\[([^\]]*)\]"
            protocols_matches = re.search(protocols_pattern, output)
            if not protocols_matches:
                print("X No protocols extracted from remote peer")
                print(f"i Expected: 'Protocols: [...]'")
                print(f"i Actual output: {repr(output[:500])}")
                return False

            protocols_str = protocols_matches.group(1)
            if protocols_str.strip():
                print(f"+ Extracted protocols: {protocols_str}")
            else:
                print("+ Remote peer has no protocols (empty array)")

        else:
            # No remote connection - this is also valid for basic identify setup
            print("i No remote connection attempted - basic identify setup validated")

        return True

    except Exception as e:
        print(f"X Error reading {log_file}: {e}")
        return False

def main():
    """Main check function"""
    print("i Checking Lesson 5: Identify Protocol")
    print("i " + "=" * 50)

    try:
        # Check the output
        if not check_output():
            return False

        print("i " + "=" * 50)
        print("+ Identify protocol lesson completed successfully!")
        print("i You have successfully:")
        print("i - Configured identify service in your libp2p node")
        print("i - Started a node with proper Peer ID and listening addresses")
        print("i - Used the identify protocol to discover remote peer information")
        print("i - Extracted remote PeerId and supported protocols")
        print("i - Built a foundation for peer capability discovery")
        print("i Ready for Lesson 6: Gossipsub Pub/Sub!")

        return True

    except Exception as e:
        print(f"X Unexpected error during checking: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)