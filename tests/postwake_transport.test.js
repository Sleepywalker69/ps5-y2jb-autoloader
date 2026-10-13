const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(require('path').join(__dirname,
    '../src/postwake_status.js'), 'utf8');

function run(chunks, options = {}) {
    let current = Buffer.alloc(0);
    let sent = 0n;
    let closed = false;
    let shutdown = false;
    const operations = { socket: 1n, setsockopt: 2n, connect: 3n,
                         write: 4n, read: 5n, close: 6n };
    const context = {
        SYSCALL: operations, AF_INET: 2n, SOCK_STREAM: 1n,
        SOL_SOCKET: 0xffffn, TextDecoder,
        malloc: () => 0x1000n,
        write64: () => {}, write32: () => {}, write16: () => {},
        write8: () => {},
        read_buffer: (_address, length) => [...current.subarray(0, Number(length))],
        syscall: (operation, ...args) => {
            if (operation === operations.socket) return 7n;
            if (operation === operations.setsockopt) return 0n;
            if (operation === operations.connect)
                return options.connectFails ? -1n : 0n;
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
            if (operation === operations.close) { closed = true; return 0n; }
            throw new Error('unexpected syscall ' + operation);
        },
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    context.bpr_elf_path = () => '/fake.elf';
    context.bpr_read_elf = () => ({ bytes: 0x2000n, size: 182784n });
    let result;
    let error;
    try { result = context.bpr_launch_v3_attempt(); }
    catch (e) { error = e; }
    return { result, error, sent, closed, shutdown };
}

const armLine = 'BPR_ARM_V2 id=6ace3357104ff054 base=ffffffff998a0000 ' +
                'root=000000001d6f4000\n';
let outcome = run(['[+] Hook installed\nBPR_ARM_V2 id=6ace3357104ff054 ',
                   'base=ffffffff998a0000 root=000000001d6f4000\n']);
assert.ifError(outcome.error);
assert.strictEqual(outcome.result.armId, 0x6ace3357104ff054n);
assert.strictEqual(outcome.result.textBase, 0xffffffff998a0000n);
assert.strictEqual(outcome.result.pmapRoot, 0x1d6f4000n);
assert.strictEqual(outcome.sent, 182784n);
assert(outcome.shutdown && outcome.closed);

outcome = run(['[+] Hook installed\n']);
assert.match(outcome.error.message, /without arm line/);
assert(outcome.closed);

outcome = run([armLine], { connectFails: true });
assert.match(outcome.error.message, /elfldr is unavailable/);
assert.strictEqual(outcome.sent, 0n);
assert(outcome.closed);

outcome = run(['BPR_ARM_V2 id=0000000000000000 base=ffffffff998a0000 ' +
               'root=000000001d6f4000\n']);
assert.match(outcome.error.message, /without arm line/);
assert(outcome.closed);

console.log('V3 hook transport: 4 cases passed');
