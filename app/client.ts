import {connect, Socket} from "net"
import struct from "./struct"
import {Packet, PacketType, sha256} from "./utils";
import {consola} from "consola";
import chalk from "chalk";

export function bootstrap(portForward: number, host: string, key: string, port: number) {
    const client = new Socket()
    const socks = new Map<number, Socket>()

    consola.log("SCHEMA: RS > C > LS")

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

        if (process.env.NODE_ENV !== "production") {
            consola.log(chalk.bgCyan.bold`  FP > C  `)
            consola.log(`  TYPE   : ${packet.type}`)
            consola.log(`  SOCKID : ${packet.socketId}`)
            consola.log(`  PACKET : ${packet.innerPacket}`)
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
                        Buffer.from([PacketType.SocketPacket]),
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
