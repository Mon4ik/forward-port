# Forward Port
Your local port forwarding

## Installation
- Install from NPM
  ```shell
  npm i -g @idkncc/forward-port
  forward-port server <preshared-key>
  ```
- Build
  ```shell
  #1. Install deps
  yarn
  
  #2. Build
  yarn dev
    
  #3. Run
  yarn start server <preshared-key>
  # or
  # node ./bin server <preshared-key>
  ```

## Usage
> **Note:** Pre-Shared key needs to be random and identical on server and client
```shell
# Generate unique pre-shared key
forward-port gen-key [length]

# Create ForwardPort (FP) Server
forward-port server <preshared-key> [-p <other-port>]

# Create ForwardPort Client
forward-port server <local-port> <fp-server> <preshared-key> [-p <other-port>]
```