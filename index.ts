import {Command} from "commander";

import * as server from "./app/server"
import * as client from "./app/client"

import {existsSync} from "fs";
import {join} from "path";
import {randomBytes} from "crypto";
import {consola} from "consola";
import chalk from "chalk";

const app = new Command()
const packageJSON = existsSync(join(__dirname, "package.json")) ? require(join(__dirname, "package.json")) : require(join(__dirname, "../package.json"))

app.name("forward-port")
    .description("Your local port forwarding")
    .version(packageJSON.version)

app.command("client")
    .description("Client Mode")
    .argument("portForward", "Port for forwarding")
    .argument("host", "Server's IP")
    .argument("key", "Pre-shared key")
    .option("-p, --port <port>", "Port to server", "1337")
    .action((portForward, host, key, opt) => {
        client.bootstrap(parseInt(portForward), host, key, parseInt(opt.port))
    })

app.command("server")
    .description("Server Mode")
    .argument("key", "Pre-shared key")
    .option("-p, --port <port>", "Port for server", "1337")
//  .option("--encryption", "Add additional encryption")
    .action((key, opt) => {
        server.bootstrap(key, parseInt(opt.port))
    })

app.command("gen-key")
    .argument("[length]", "Length of key", (i) => parseInt(i, 10), 40)
    .action((len: number) => {
        consola.success(`Generated pre-shared key: ${chalk.bold.underline(randomBytes(len / 2).toString("hex"))}`)
    })

app.parse()
