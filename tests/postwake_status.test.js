const assert = require('node:assert/strict');
const { parse_bpr_arm_v1, parse_bpr_status_v2,
        parse_bpr_arm_v2, parse_bpr_status_v3 } =
    require('../src/postwake_status.js');

const boot = { sec: 1791893784, usec: 399222 };
const armId = 0x6ad18e689ca12345n;
const good = 'BPR_STATUS_V2 ok=1 fw=13600007 boot=1791893784.399222 ' +
    'base=ffffffffd3b70000 stage=41505f434f4d504c ' +
    'hook=0000000000000000 arm=6ad18e689ca12345 ' +
    'complete=6ad18e689ca12345 gate=1 ist=1\n';

assert.equal(parse_bpr_arm_v1('log\nBPR_ARM_V1 id=6ad18e689ca12345\n'), armId);
for (const output of [
    '', 'BPR_ARM_V1 id=0000000000000000\n',
    'BPR_ARM_V1 id=6ad18e689ca12345\nBPR_ARM_V1 id=6ad18e689ca12345\n',
    'BPR_ARM_V1 id=xyz\n',
]) assert.equal(parse_bpr_arm_v1(output), null);

assert.deepEqual(parse_bpr_status_v2(good, boot, armId), {
    bootSec: boot.sec, bootUsec: boot.usec,
    textBase: 0xffffffffd3b70000n, armId
});

for (const output of [
    good.slice(0, -1),
    good + good,
    'loader output\n' + good,
    good.replace('ok=1', 'ok=0'),
    good.replace('13600007', '13600006'),
    good.replace('41505f434f4d504c', '0000000000000000'),
    good.replace('hook=0000000000000000', 'hook=0000000000000001'),
    good.replace('arm=6ad18e689ca12345', 'arm=6ad18e689ca12346'),
    good.replace('complete=6ad18e689ca12345', 'complete=6ad18e689ca12346'),
    good.replace('gate=1', 'gate=0'),
    good.replace('ist=1', 'ist=0'),
    good.replace('d3b70000', '00000000'),
    good.replace('1791893784', '1791893785'),
    good.replace('399222', '399223'),
]) {
    assert.equal(parse_bpr_status_v2(output, boot, armId), null, output);
}
assert.equal(parse_bpr_status_v2(good, { sec: boot.sec + 1, usec: boot.usec }, armId), null);
assert.equal(parse_bpr_status_v2(good, { sec: boot.sec, usec: 1000000 }, armId), null);
assert.equal(parse_bpr_status_v2(good, boot, armId + 1n), null);
console.log('attempt receipt parsers: 23 cases passed');

const arm2 = 'BPR_ARM_V2 id=6ace30b47751d056 base=ffffffffcdc90000 root=00000000179c4000\n';
const expect3 = { armId: 0x6ace30b47751d056n,
    textBase: 0xffffffffcdc90000n, pmapRoot: 0x179c4000n };
assert.deepEqual(parse_bpr_arm_v2('Hook installed\n' + arm2), expect3);
for (const value of [
    '', arm2 + arm2, arm2.replace('6ace30b47751d056', '0000000000000000'),
    arm2.replace('cdc90000', 'cdc90001'),
    arm2.replace('179c4000', '179c4001'),
    arm2.replace('179c4000', '00000000'),
    arm2.replace('BPR_ARM_V2', 'BPR_ARM_V1'),
]) assert.equal(parse_bpr_arm_v2(value), null, value);

const good3 = 'BPR_STATUS_V3 ok=1 fw=13600007 boot=1791897726.214153 ' +
    'base=ffffffffcdc90000 root=00000000179c4000 ' +
    'stage=41505f434f4d504c hook=0000000000000000 ' +
    'arm=6ace30b47751d056 complete=6ace30b47751d056 gate=1 ist=1\n';
assert.deepEqual(parse_bpr_status_v3(good3, expect3), {
    bootSec: 1791897726, bootUsec: 214153, ...expect3
});
for (const value of [
    '', good3 + good3, 'prefix\n' + good3,
    good3.replace('ok=1', 'ok=0'),
    good3.replace('13600007', '13600006'),
    good3.replace('cdc90000', 'cdc80000'),
    good3.replace('179c4000', '179c5000'),
    good3.replace('41505f434f4d504c', '0000000000000000'),
    good3.replace('hook=0000000000000000', 'hook=0000000000000001'),
    good3.replace('arm=6ace30b47751d056', 'arm=6ace30b47751d057'),
    good3.replace('complete=6ace30b47751d056', 'complete=6ace30b47751d057'),
    good3.replace('gate=1', 'gate=0'),
    good3.replace('ist=1', 'ist=0'),
    good3.slice(0, -1),
]) assert.equal(parse_bpr_status_v3(value, expect3), null, value);
assert.equal(parse_bpr_status_v3(good3, { ...expect3, armId: 1n }), null);
assert.equal(parse_bpr_status_v3(good3, { ...expect3, textBase: 0xffffffff00000000n }), null);
assert.equal(parse_bpr_status_v3(good3, { ...expect3, pmapRoot: 0x1000n }), null);
console.log('V3 kernel-instance receipt parsers: 25 cases passed');
