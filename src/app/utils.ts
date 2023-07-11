import {createHash} from "crypto";
import struct from "./struct";

export enum PacketType {
    Connection,
    NewSocket,
    SocketPacket,
    SocketClose
}

export function sha256(data: string) {
    return createHash("sha256").update(data).digest()
}

export function mapGetKey<K, V>(map: Map<K, V>, searchValue: V): K {
    for (let [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
}

export class Packet {
    constructor(private packet: Buffer) {
    }

    public get type(): PacketType {
        return this.packet[0]
    }

    public get socketId(): number {
        return this.packet[1]
    }

    public get innerPacket(): Buffer {
        const withSocketId = this.type !== PacketType.Connection
        return this.packet.subarray(withSocketId ? 2 : 1)
    }
}

export function chunk(str: string, len: number): string[] {
    const size = Math.ceil(str.length/len)
    const r = Array(size)
    let offset = 0

    for (let i = 0; i < size; i++) {
        r[i] = str.substr(offset, len)
        offset += len
    }

    return r
}