const assert = require('node:assert/strict');
const { parse_bpr_status_v1 } = require('../src/postwake_status.js');

const boot = { sec: 1791893784, usec: 399222 };
const good = 'BPR_STATUS_V1 ok=1 fw=13600007 boot=1791893784.399222 ' +
    'base=ffffffffd3b70000 stage=41505f434f4d504c ' +
    'hook=0000000000000000 gate=1 ist=1\n';

assert.deepEqual(parse_bpr_status_v1(good, boot), {
    bootSec: boot.sec, bootUsec: boot.usec,
    textBase: 0xffffffffd3b70000n
});

for (const output of [
    good.slice(0, -1),
    good + good,
    'loader output\n' + good,
    good.replace('ok=1', 'ok=0'),
    good.replace('13600007', '13600006'),
    good.replace('41505f434f4d504c', '0000000000000000'),
    good.replace('hook=0000000000000000', 'hook=0000000000000001'),
    good.replace('gate=1', 'gate=0'),
    good.replace('ist=1', 'ist=0'),
    good.replace('d3b70000', '00000000'),
    good.replace('1791893784', '1791893785'),
    good.replace('399222', '399223'),
]) {
    assert.equal(parse_bpr_status_v1(output, boot), null, output);
}
assert.equal(parse_bpr_status_v1(good, { sec: boot.sec + 1, usec: boot.usec }), null);
assert.equal(parse_bpr_status_v1(good, { sec: boot.sec, usec: 1000000 }), null);
console.log('post-wake status parser: 15 cases passed');
