const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(require('path').join(__dirname,
    '../src/postwake_status.js'), 'utf8');

async function run(chunks, options = {}) {
    let current = Buffer.alloc(0);
    let sent = 0n;
    let closed = 0;
    let shutdown = false;
    let connects = 0;
    let sleeps = 0;
    const operations = { socket: 1n, setsockopt: 2n, connect: 3n,
                         write: 4n, read: 5n, close: 6n };
    const context = {
        SYSCALL: operations, AF_INET: 2n, SOCK_STREAM: 1n,
        SOL_SOCKET: 0xffffn, TextDecoder,
        setTimeout: callback => { sleeps++; callback(); },
        malloc: () => 0x1000n,
        write64: () => {}, write32: () => {}, write16: () => {},
        write8: () => {},
        read_buffer: (_address, length) => [...current.subarray(0, Number(length))],
        syscall: (operation, ...args) => {
            if (operation === operations.socket) return 7n;
            if (operation === operations.setsockopt) return 0n;
            if (operation === operations.connect) {
                connects++;
                return connects <= (options.connectFailuresBeforeSuccess || 0)
                    ? -1n : 0n;
            }
            if (operation === operations.write) {
                const n = args[2] < 997n ? args[2] : 997n;
                sent += n;
                return n;
            }
            if (operation === 134n) { shutdown = true; return 0n; }
            if (operation === operations.read) {
                if (!chunks.length) return 0n;
                current = Buffer.from(chunks.shift());
                return BigInt(current.length);
            }
            if (operation === operations.close) { closed++; return 0n; }
            throw new Error('unexpected syscall ' + operation);
        },
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    context.bpr_elf_path = () => '/fake.elf';
    context.bpr_read_elf = () => ({ bytes: 0x2000n, size: 209576n });
    let result;
    let error;
    try { result = await context.bpr_launch_v3_attempt(); }
    catch (e) { error = e; }
    return { result, error, sent, closed, shutdown, connects, sleeps };
}

const armLine = 'BPR_ARM_V2 id=6ace3357104ff054 base=ffffffff998a0000 ' +
                'root=000000001d6f4000\n';
async function main() {
let outcome = await run(['[+] Hook installed\nBPR_ARM_V2 id=6ace3357104ff054 ',
                   'base=ffffffff998a0000 root=000000001d6f4000\n']);
assert.ifError(outcome.error);
assert.strictEqual(outcome.result.armId, 0x6ace3357104ff054n);
assert.strictEqual(outcome.result.textBase, 0xffffffff998a0000n);
assert.strictEqual(outcome.result.pmapRoot, 0x1d6f4000n);
assert.strictEqual(outcome.sent, 209576n);
assert(outcome.shutdown && outcome.closed === 1);
assert.strictEqual(outcome.connects, 1);

outcome = await run(['[+] Hook installed\n']);
assert.match(outcome.error.message, /without arm line/);
assert.strictEqual(outcome.closed, 1);

outcome = await run([armLine], { connectFailuresBeforeSuccess: 50 });
assert.match(outcome.error.message, /elfldr unavailable after 50 checks/);
assert.strictEqual(outcome.sent, 0n);
assert.strictEqual(outcome.closed, 50);
assert.strictEqual(outcome.connects, 50);
assert.strictEqual(outcome.sleeps, 49);

outcome = await run([armLine], { connectFailuresBeforeSuccess: 3 });
assert.ifError(outcome.error);
assert.strictEqual(outcome.connects, 4);
assert.strictEqual(outcome.sleeps, 3);
assert.strictEqual(outcome.closed, 4);
assert.strictEqual(outcome.sent, 209576n);

outcome = await run(['BPR_ARM_V2 id=0000000000000000 base=ffffffff998a0000 ' +
               'root=000000001d6f4000\n']);
assert.match(outcome.error.message, /without arm line/);
assert.strictEqual(outcome.closed, 1);

console.log('Post-wake hook transport: 5 cases passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
