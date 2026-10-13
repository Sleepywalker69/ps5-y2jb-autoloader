/* Verify one saved host arm record against an independent post-wake status. */
const fs = require('fs');
const { parse_bpr_arm_v2, parse_bpr_status_v3 } =
    require('../src/postwake_status.js');

if (process.argv.length !== 5) {
    throw new Error('usage: node check_live_receipt.js ATTEMPT.log ATTEMPT.json STATUS.log');
}

const attemptOutput = fs.readFileSync(process.argv[2], 'utf8');
const saved = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const statusOutput = fs.readFileSync(process.argv[4], 'utf8');
const arm = parse_bpr_arm_v2(attemptOutput);
if (!arm || saved.arm_id !== arm.armId.toString(16).padStart(16, '0') ||
    saved.kernel_text_base !== arm.textBase.toString(16).padStart(16, '0') ||
    saved.kernel_pmap_root !== arm.pmapRoot.toString(16).padStart(16, '0') ||
    !saved.arm_utc || !saved.payload_sha256) {
    throw new Error('saved arm record does not match host output');
}

const status = parse_bpr_status_v3(statusOutput, arm);
if (!status) throw new Error('V3 post-wake receipt rejected');
console.log('V3 receipt passed: id=' + arm.armId.toString(16).padStart(16, '0') +
            ' base=' + arm.textBase.toString(16).padStart(16, '0') +
            ' root=' + arm.pmapRoot.toString(16).padStart(16, '0'));
