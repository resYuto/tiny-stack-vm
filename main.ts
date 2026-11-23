// A tiny stack VM for make.fun's tiny stack ISA v1: runs /input/<id>/program.bin on its input.bin
// and writes /output/<id>/stdout.bin and exit.txt (the exit code, or the trap's code).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Per opcode byte: immediate bytes, values popped, values pushed. IMM -1 marks an unknown opcode.
const IMM = new Int8Array(256).fill(-1);
const POP = new Int8Array(256);
const PUSH = new Int8Array(256);
// Each entry: opcode (2 hex digits), then immediate bytes, pops, pushes (1 digit each).
for (const s of ('00000 01101 02401 03010 04012 05022 06023 07033 10021 11021 12021 13021 14021 15021 16021 ' +
  '17011 18021 19021 1a021 1b011 1c021 1d021 1e021 20021 21021 22021 30200 31210 32210 33200 34000 ' +
  '40011 41020 50010 51010 52001 53010').split(' ')) {
  const op = parseInt(s.slice(0, 2), 16);
  IMM[op] = +s[2]; POP[op] = +s[3]; PUSH[op] = +s[4];
}

const LIMIT = 1_000_000;
const OMAX = 65_536;

function run(p: Uint8Array, inp: Uint8Array): [Uint8Array, number] {
  const n = p.length;
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), O = new Uint8Array(OMAX);
  let sp = 0, csp = 0, o = 0, ip = 0, pc = 0, steps = 0, a = 0, b = 0;
  for (;;) {
    if (steps === LIMIT) return [O.subarray(0, o), 10];
    if (pc < 0 || pc >= n) return [O.subarray(0, o), 9];
    const op = p[pc], imm = IMM[op];
    if (imm < 0) return [O.subarray(0, o), 5];
    if (pc + imm >= n) return [O.subarray(0, o), 9];
    steps++;
    if (sp < POP[op]) return [O.subarray(0, o), 2];
    if (sp - POP[op] + PUSH[op] > 256) return [O.subarray(0, o), 3];
    pc += 1 + imm;
    if (op >= 0x10 && op <= 0x22 && POP[op] === 2) {
      b = D[--sp]; a = D[sp - 1];
      let r = 0;
      switch (op) {
        case 0x10: r = (a + b) | 0; break;
        case 0x11: r = (a - b) | 0; break;
        case 0x12: r = Math.imul(a, b); break;
        case 0x13: if (b === 0) return [O.subarray(0, o), 4]; r = a === -2147483648 && b === -1 ? a : (a / b) | 0; break;
        case 0x14: if (b === 0) return [O.subarray(0, o), 4]; r = b === -1 ? 0 : (a % b) | 0; break;
        case 0x15: if (b === 0) return [O.subarray(0, o), 4]; r = Math.floor((a >>> 0) / (b >>> 0)) | 0; break;
        case 0x16: if (b === 0) return [O.subarray(0, o), 4]; r = ((a >>> 0) % (b >>> 0)) | 0; break;
        case 0x18: r = a & b; break;
        case 0x19: r = a | b; break;
        case 0x1a: r = a ^ b; break;
        case 0x1c: r = a << (b & 31); break;
        case 0x1d: r = a >> (b & 31); break;
        case 0x1e: r = (a >>> (b & 31)) | 0; break;
        case 0x20: r = a === b ? 1 : 0; break;
        case 0x21: r = a < b ? 1 : 0; break;
        case 0x22: r = a >>> 0 < b >>> 0 ? 1 : 0; break;
      }
      D[sp - 1] = r;
      continue;
    }
    switch (op) {
      case 0x00: return [O.subarray(0, o), 0];
      case 0x01: D[sp++] = (p[pc - 1] << 24) >> 24; break;
      case 0x02: D[sp++] = p[pc - 4] | (p[pc - 3] << 8) | (p[pc - 2] << 16) | (p[pc - 1] << 24); break;
      case 0x03: sp--; break;
      case 0x04: D[sp] = D[sp - 1]; sp++; break;
      case 0x05: a = D[sp - 1]; D[sp - 1] = D[sp - 2]; D[sp - 2] = a; break;
      case 0x06: D[sp] = D[sp - 2]; sp++; break;
      case 0x07: a = D[sp - 3]; D[sp - 3] = D[sp - 2]; D[sp - 2] = D[sp - 1]; D[sp - 1] = a; break;
      case 0x17: D[sp - 1] = -D[sp - 1] | 0; break;
      case 0x1b: D[sp - 1] = ~D[sp - 1]; break;
      case 0x30: pc += ((p[pc - 2] | (p[pc - 1] << 8)) << 16) >> 16; break;
      case 0x31: if (D[--sp] === 0) pc += ((p[pc - 2] | (p[pc - 1] << 8)) << 16) >> 16; break;
      case 0x32: if (D[--sp] !== 0) pc += ((p[pc - 2] | (p[pc - 1] << 8)) << 16) >> 16; break;
      case 0x33:
        if (csp === 64) return [O.subarray(0, o), 7];
        C[csp++] = pc; pc = p[pc - 2] | (p[pc - 1] << 8); break;
      case 0x34:
        if (csp === 0) return [O.subarray(0, o), 8];
        pc = C[--csp]; break;
      case 0x40:
        a = D[sp - 1];
        if (a < 0 || a > 255) return [O.subarray(0, o), 6];
        D[sp - 1] = M[a]; break;
      case 0x41:
        a = D[sp - 1];
        if (a < 0 || a > 255) return [O.subarray(0, o), 6];
        M[a] = D[sp - 2]; sp -= 2; break;
      case 0x50: {
        const s = String(D[sp - 1]);
        if (o + s.length > OMAX) return [O.subarray(0, o), 11];
        sp--;
        for (let i = 0; i < s.length; i++) O[o++] = s.charCodeAt(i);
        break;
      }
      case 0x51:
        if (o >= OMAX) return [O.subarray(0, o), 11];
        O[o++] = D[--sp]; break;
      case 0x52: D[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 0x53: return [O.subarray(0, o), D[--sp] & 255];
    }
  }
}

const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const read = (f: string) => { try { return new Uint8Array(readFileSync(f)); } catch { return new Uint8Array(0); } };
for (const id of readdirSync(I).sort()) {
  const dir = join(OUT, id);
  mkdirSync(dir, { recursive: true });
  let res: [Uint8Array, number] = [new Uint8Array(0), 0];
  try { res = run(read(join(I, id, 'program.bin')), read(join(I, id, 'input.bin'))); } catch {}
  writeFileSync(join(dir, 'stdout.bin'), res[0]);
  writeFileSync(join(dir, 'exit.txt'), res[1] + '\n');
}
