import {createServer, Socket} from "net"
import {createHash} from "crypto";
import struct from "./struct"

import {consola} from "consola";
import chalk from "chalk";
import {sha256, PacketType, Packet, mapGetKey} from "./utils";


export function bootstrap(key: string, port: number, debug: boolean) {
    const server = createServer()
    let clientConnected = false
    let client: Socket = null
    let socks = new Map<number, Socket>()
    let socksNextId = 1

    server.on("connection", (sock) => {
        if (clientConnected) {
            client.write(
                Buffer.from([PacketType.NewSocket, socksNextId])
            )
            socks.set(structuredClone(socksNextId), sock)
            socksNextId++
        }

        function tryInitClient(authPacket: Buffer) {
            if (authPacket.toString() === sha256(key).toString()) {
                client = sock
                clientConnected = true
                client.write(Buffer.from([PacketType.Connection, 255]))

                client.on("data", (pack) => {
                    const packet = new Packet(pack)

                    if (packet.type === PacketType.SocketPacket) {
                        socks.get(packet.socketId).write(packet.innerPacket)
                    } else if (pack[0] === PacketType.SocketClose) {
                        socks.get(packet.socketId).destroy()
                    }
                })

                client.on("close", () => {
                    client = null
                    clientConnected = false

                    consola.warn("Client disconnected.")
                })

                consola.success("Client connected!")
            } else {
                sock.write(Buffer.from([PacketType.Connection, 0]))
            }
        }

        sock.on("data", (packet) => {
            // client connection init (only first time)
            if (!clientConnected) {
                tryInitClient(packet)
                return
            }
            if (client === sock) return;

            // else
            client.write(Buffer.concat([
                Buffer.from([PacketType.SocketPacket, mapGetKey(socks, sock)]),
                packet
            ]))
        })

        sock.on("close", () => {
            client.write(Buffer.from([
                PacketType.SocketClose, mapGetKey(socks, sock)
            ]))
        })
    })

    server.listen(
        port,
        () => consola.success(`Forward Port is running on ${chalk.bold`::${port}`}`)
    )
}
