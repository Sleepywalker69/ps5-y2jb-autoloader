/* Draft attempt-specific Byepervisor receipt gate. No autoload side effects. */

function parse_bpr_arm_v1(output) {
    if (typeof output !== 'string' || output.length > 4096) return null;
    const lines = output.replace(/\r/g, '').split('\n');
    const arms = lines.filter(line => line.startsWith('BPR_ARM_V1 '));
    if (arms.length !== 1) return null;
    const match = /^BPR_ARM_V1 id=([0-9a-f]{16})$/.exec(arms[0]);
    if (!match || match[1] === '0000000000000000') return null;
    return BigInt('0x' + match[1]);
}

function parse_bpr_arm_v2(output) {
    if (typeof output !== 'string' || output.length > 4096) return null;
    const lines = output.replace(/\r/g, '').split('\n');
    const arms = lines.filter(line => line.startsWith('BPR_ARM_V2 '));
    if (arms.length !== 1) return null;
    const match = /^BPR_ARM_V2 id=([0-9a-f]{16}) base=(ffffffff[0-9a-f]{8}) root=([0-9a-f]{16})$/.exec(arms[0]);
    if (!match || match[1] === '0000000000000000') return null;
    const textBase = BigInt('0x' + match[2]);
    const pmapRoot = BigInt('0x' + match[3]);
    if ((textBase & 0xffffn) !== 0n || pmapRoot === 0n ||
        (pmapRoot & 0xfffn) !== 0n || pmapRoot > 0x000fffffffffffffn)
        return null;
    return { armId: BigInt('0x' + match[1]), textBase, pmapRoot };
}

function parse_bpr_status_v2(output, expectedBoot, expectedArm) {
    if (typeof output !== 'string' || output.length > 4096 ||
        !expectedBoot || !Number.isSafeInteger(expectedBoot.sec) ||
        !Number.isSafeInteger(expectedBoot.usec) || expectedBoot.sec <= 0 ||
        expectedBoot.usec < 0 || expectedBoot.usec >= 1000000 ||
        typeof expectedArm !== 'bigint' || expectedArm <= 0n ||
        expectedArm > 0xffffffffffffffffn) return null;
    const match = /^BPR_STATUS_V2 ok=1 fw=([0-9a-f]{8}) boot=([0-9]{1,12})\.([0-9]{6}) base=([0-9a-f]{16}) stage=([0-9a-f]{16}) hook=([0-9a-f]{16}) arm=([0-9a-f]{16}) complete=([0-9a-f]{16}) gate=1 ist=1\r?\n$/.exec(output);
    if (!match || match[1] !== '13600007' ||
        match[5] !== '41505f434f4d504c' ||
        match[6] !== '0000000000000000' ||
        BigInt('0x' + match[7]) !== expectedArm ||
        match[7] !== match[8] ||
        Number(match[2]) !== expectedBoot.sec ||
        Number(match[3]) !== expectedBoot.usec ||
        !/^ffffffff[0-9a-f]{8}$/.test(match[4]) ||
        Number.parseInt(match[4].slice(8), 16) < 0x10000 ||
        (Number.parseInt(match[4].slice(8), 16) & 0xffff) !== 0) return null;
    return { bootSec: Number(match[2]), bootUsec: Number(match[3]),
             textBase: BigInt('0x' + match[4]), armId: expectedArm };
}

function parse_bpr_status_v3(output, expected) {
    if (typeof output !== 'string' || output.length > 4096 ||
        !expected || typeof expected.armId !== 'bigint' ||
        typeof expected.textBase !== 'bigint' ||
        typeof expected.pmapRoot !== 'bigint' || expected.armId <= 0n ||
        expected.armId > 0xffffffffffffffffn ||
        (expected.textBase >> 32n) !== 0xffffffffn ||
        (expected.textBase & 0xffffn) !== 0n ||
        expected.pmapRoot === 0n || (expected.pmapRoot & 0xfffn) !== 0n ||
        expected.pmapRoot > 0x000fffffffffffffn) return null;
    const match = /^BPR_STATUS_V3 ok=1 fw=([0-9a-f]{8}) boot=([0-9]{1,12})\.([0-9]{6}) base=([0-9a-f]{16}) root=([0-9a-f]{16}) stage=([0-9a-f]{16}) hook=([0-9a-f]{16}) arm=([0-9a-f]{16}) complete=([0-9a-f]{16}) gate=1 ist=1\r?\n$/.exec(output);
    if (!match || match[1] !== '13600007' ||
        match[6] !== '41505f434f4d504c' ||
        match[7] !== '0000000000000000' ||
        BigInt('0x' + match[4]) !== expected.textBase ||
        BigInt('0x' + match[5]) !== expected.pmapRoot ||
        BigInt('0x' + match[8]) !== expected.armId ||
        match[8] !== match[9] ||
        !Number.isSafeInteger(Number(match[2])) || Number(match[2]) <= 0 ||
        Number(match[3]) >= 1000000) return null;
    return { bootSec: Number(match[2]), bootUsec: Number(match[3]),
             textBase: expected.textBase, pmapRoot: expected.pmapRoot,
             armId: expected.armId };
}

function bpr_current_boot() {
    const value = malloc(16n);
    const size = malloc(8n);
    write64(size, 16n);
    if (!sysctlbyname('kern.boottime', value, size, 0n, 0n) ||
        read64(size) !== 16n) throw new Error('cannot read kern.boottime');
    const sec = Number(read64(value));
    const usec = Number(read64(value + 8n));
    if (!Number.isSafeInteger(sec) || sec <= 0 ||
        !Number.isSafeInteger(usec) || usec < 0 || usec >= 1000000)
        throw new Error('invalid kern.boottime');
    return { sec, usec };
}

function bpr_syscall_failed(value) {
    return value > 0x7fffffffffffffffn;
}

function bpr_elf_path(name) {
    for (const slot of ['000', '001', '002']) {
        const path = '/mnt/sandbox/' + TITLE_ID + '_' + slot +
            '/download0/cache/splash_screen/aHR0cHM6Ly93d3cueW91dHViZS5jb20vdHY=/' + name;
        const stat = malloc(0x100n);
        if (syscall(SYSCALL.stat, alloc_string(path), stat) === 0n)
            return path;
    }
    throw new Error(name + ' is missing from this title');
}

function bpr_read_elf(path) {
    const stat = malloc(0x100n);
    if (syscall(SYSCALL.stat, alloc_string(path), stat) !== 0n)
        throw new Error('cannot stat status ELF');
    const size = read64(stat + 0x48n);
    if (size <= 0n || size > 262144n)
        throw new Error('invalid status ELF length');
    const fd = syscall(SYSCALL.open, alloc_string(path), O_RDONLY, 0n);
    if (bpr_syscall_failed(fd)) throw new Error('cannot open status ELF');
    const bytes = malloc(size);
    try {
        let total = 0n;
        while (total < size) {
            const got = syscall(SYSCALL.read, fd, bytes + total, size - total);
            if (got <= 0n || got > size - total || bpr_syscall_failed(got))
                throw new Error('incomplete status ELF read');
            total += got;
        }
    } finally {
        syscall(SYSCALL.close, fd);
    }
    return { bytes, size };
}

async function bpr_connect_elfldr(label, timeoutSeconds) {
    // Relapse hands off before its new elfldr thread necessarily accepts a
    // connection. Each attempt gets a fresh socket, as in autoload.js.
    let lastConnect = null;
    for (let attempt = 1; attempt <= 50; attempt++) {
        const fd = syscall(SYSCALL.socket, AF_INET, SOCK_STREAM, 0n);
        if (bpr_syscall_failed(fd))
            throw new Error(label + ' socket failed');
        let connected = false;
        try {
            const timeout = malloc(16n);
            write64(timeout, BigInt(timeoutSeconds));
            write64(timeout + 8n, 0n);
            if (syscall(SYSCALL.setsockopt, fd, SOL_SOCKET, 0x1006n,
                        timeout, 16n) !== 0n)
                throw new Error(label + ' socket timeout failed');
            const address = malloc(16n);
            write8(address, 16n);
            write8(address + 1n, AF_INET);
            write16(address + 2n, 0x3d23n); // 127.0.0.1:9021
            write32(address + 4n, 0x0100007fn);
            lastConnect = syscall(SYSCALL.connect, fd, address, 16n);
            if (lastConnect === 0n) {
                connected = true;
                return { fd, attempt };
            }
        } finally {
            if (!connected) syscall(SYSCALL.close, fd);
        }
        if (attempt < 50)
            await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error(label + ' elfldr unavailable after 50 checks; last connect=' +
                    (lastConnect === null ? 'none' : '0x' +
                     BigInt.asUintN(64, lastConnect).toString(16)));
}

async function bpr_query_elfldr_status(expectedArm) {
    const payload = bpr_read_elf(bpr_elf_path('attempt_status_v3_1360.elf'));
    const { fd } = await bpr_connect_elfldr('status', 3);
    try {
        let sent = 0n;
        while (sent < payload.size) {
            const n = syscall(SYSCALL.write, fd, payload.bytes + sent,
                              payload.size - sent);
            if (n <= 0n || n > payload.size - sent || bpr_syscall_failed(n))
                throw new Error('status ELF send was incomplete');
            sent += n;
        }
        if (syscall(134n, fd, 1n) !== 0n) // shutdown(SHUT_WR)
            throw new Error('status socket shutdown failed');
        const buffer = malloc(512n);
        const collected = [];
        for (;;) {
            const n = syscall(SYSCALL.read, fd, buffer, 512n);
            if (bpr_syscall_failed(n))
                throw new Error('status reply timed out or failed');
            if (n === 0n) break;
            if (n > 512n || collected.length + Number(n) > 4096)
                throw new Error('status reply is too large');
            for (const byte of read_buffer(buffer, n)) collected.push(byte);
            if (collected.includes(10)) break;
        }
        const reply = new TextDecoder().decode(new Uint8Array(collected));
        if (!reply.endsWith('\n')) throw new Error('status reply is truncated');
        const status = parse_bpr_status_v3(reply, expectedArm);
        if (!status) throw new Error('post-wake AP status did not pass');
        return status;
    } finally {
        syscall(SYSCALL.close, fd);
    }
}

async function bpr_launch_v3_attempt() {
    const payload = bpr_read_elf(bpr_elf_path('byepervisor_reborn_postwake_config_1360.elf'));
    if (payload.size !== 209408n)
        throw new Error('unexpected post-wake hook ELF length');
    const { fd } = await bpr_connect_elfldr('hook', 5);
    try {
        let sent = 0n;
        while (sent < payload.size) {
            const n = syscall(SYSCALL.write, fd, payload.bytes + sent,
                              payload.size - sent);
            if (n <= 0n || n > payload.size - sent || bpr_syscall_failed(n))
                throw new Error('V3 hook ELF send was incomplete');
            sent += n;
        }
        if (syscall(134n, fd, 1n) !== 0n) // shutdown(SHUT_WR)
            throw new Error('hook socket shutdown failed');
        const buffer = malloc(512n);
        let output = '';
        for (;;) {
            const n = syscall(SYSCALL.read, fd, buffer, 512n);
            if (bpr_syscall_failed(n))
                throw new Error('V3 arm line timed out or failed');
            if (n === 0n) throw new Error('V3 hook ended without arm line');
            if (n > 512n || output.length + Number(n) > 4096)
                throw new Error('V3 hook output is too large');
            output += new TextDecoder().decode(
                new Uint8Array(read_buffer(buffer, n)));
            const arm = parse_bpr_arm_v2(output);
            if (arm) return arm;
        }
    } finally {
        syscall(SYSCALL.close, fd);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parse_bpr_arm_v1, parse_bpr_status_v2,
                       parse_bpr_arm_v2, parse_bpr_status_v3 };
}
