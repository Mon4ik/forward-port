import {connect, Socket} from "net"
import struct from "./struct"
import {chunk, mapGetKey, Packet, PacketType, sha256} from "./utils";
import {consola} from "consola";
import chalk from "chalk";

export function bootstrap(portForward: number, host: string, key: string, port: number, debug: boolean) {
    const client = new Socket()
    const socks = new Map<number, Socket>()

    client.connect(port, host)
    consola.start("Connecting to ForwardPort Server...")

    client.on("connect", () => {
        client.write(sha256(key))
        consola.start("Verifying...")
    })

    client.on("close", () => {
        consola.error("Connection Closed.")
        process.exit(1)
    })

    client.on("data", (pack) => {
        const packet = new Packet(pack)

        if (debug) {
            const buffer_chunked = chunk(pack.toString('hex'), 2)
            consola.log(chalk.bgCyan.bold`  FP > C  `)
            consola.log(`  BUFFER     : ${chalk.bold.bgRed(buffer_chunked.slice(0, 2).join(" "))} ${chalk.bold.bgBlackBright(buffer_chunked.slice(3).join(" "))}`)
            consola.log(`  ${chalk.underline`   PARSED   `}`)
            consola.log(`  TYPE       : ${chalk.bold(packet.type)}`)
            consola.log(`  SOCKID     : ${chalk.bold(packet.socketId)}`)
            consola.log(`  PACKET     : ${chalk.bold(packet.innerPacket)}`)
        }

        switch (packet.type) {
            case PacketType.Connection:
                if (packet.innerPacket[0] === 255) {
                    consola.success("Connected!")
                } else {
                    consola.error("Failed to connect. Verify your pre-shared key and try again")
                    process.exit(1)
                }
                break;

            case PacketType.NewSocket:
                const sock = new Socket()

                sock.connect(portForward, "127.0.0.1")
                sock.on("connect", () => {
                    consola.info("New socket created")
                })

                sock.on("data", (packet) => {
                    client.write(Buffer.concat([
                        Buffer.from([PacketType.SocketPacket, mapGetKey(socks, sock)]),
                        packet
                    ]))
                })

                socks.set(packet.socketId, sock)
                break;

            case PacketType.SocketPacket:
                const remoteSock = socks.get(packet.socketId)
                remoteSock.write(packet.innerPacket)
                break
        }
    })
}
