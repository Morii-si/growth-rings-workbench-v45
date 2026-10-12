import { initialState, restore } from './engine.js';
import { roomState } from './research-room-model.js';
import { bundledResearchBoard } from './bundled-research-content.js';

export const BUNDLED_RESEARCH_REVISION = 'v45.1';
export const LEGACY_RESEARCH_FINGERPRINT = '116076:2a9c77e0fae2d6f0';
export const legacyResearchBackupKey = key => key + ':backup:before-bundled-research-v45.1';
const clone = value => structuredClone(value);

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

// Exact compatibility recognition, not an authentication or cryptographic API.
export function researchStateFingerprint(state) {
  const content = canonical(state);
  let value = 14695981039346656037n;
  for (let index = 0; index < content.length; index++) value = BigInt.asUintN(64, (value ^ BigInt(content.charCodeAt(index))) * 1099511628211n);
  return content.length + ':' + value.toString(16);
}

export function isKnownIncompleteResearch(state) {
  return researchStateFingerprint(state) === LEGACY_RESEARCH_FINGERPRINT;
}

function validState(state) {
  return state?.schema === 1 && Array.isArray(state.versions) && state.versions.length > 0 && state.rule
    && ['annual', 'interim'].includes(state.period) && ['notes', 'chat', 'reviews'].every(key => Array.isArray(state[key]))
    && state.versions.every(version => Array.isArray(version.claims) && version.claims.length === 3 && Array.isArray(version.sources) && typeof version.summary === 'string');
}

/** Populate only the approved board; no other browser storage is shipped. */
export function createBundledResearchState(previous = null) {
  const state = previous ? clone(previous) : initialState();
  const room = roomState(state), board = clone(bundledResearchBoard);
  if (previous) {
    room.legacyLocalMessages = [...clone(room.legacyLocalMessages || []), ...clone(room.messages || [])];
    room.legacyLocalSeedMessages = [...clone(room.legacyLocalSeedMessages || []), ...clone(room.roundSeedMessages || [])];
  }
  const opening = board.messages.filter(message => message.kind === 'opening');
  const replay = board.messages.filter(message => message.kind === 'demo');
  room.roundSeedMessages = clone([...opening, ...replay]);
  room.messages = clone(board.messages.filter(message => message.kind !== 'opening' && message.kind !== 'demo'));
  room.bundledReplay = { revision: BUNDLED_RESEARCH_REVISION, boardId: board.id, seedMessageIds: replay.map(message => message.id) };
  room.generatedBoards = [...(room.generatedBoards || []), board];
  const { kind, version, generation, ...record } = clone(board);
  room.records = [...(room.records || []), record];
  room.started = true; room.workspaceMode = 'conversation'; room.conversationDraft = ''; room.roundDraft = null;
  room.scope = board.scope; room.useMemory = board.useMemory; room.memoryByDirection = clone(board.memoryByDirection || {});
  room.visitedDirections = [...new Set([...(room.visitedDirections || []), ...(board.directionIds || [])])];
  room.savedId = board.id; room.savedMessageCount = room.messages.length;
  state.period = 'interim';
  return state;
}

/** Storage adapters keep backup writes explicit and testable. Never replace unknown progress. */
export function loadBundledResearchState({ key, isDemo = false, entryStarted = false, read, write }) {
  if (entryStarted) return { state: initialState(), status: 'isolated-opening', persistBlocked: false, error: '' };
  let raw;
  try { raw = read(key); }
  catch { return { state: isDemo ? initialState() : createBundledResearchState(), status: 'storage-unavailable', persistBlocked: true, error: '无法读取本机存档；当前内容未保存，请先导出研究记录。' }; }
  if (raw === null || raw === undefined) return { state: isDemo ? initialState() : createBundledResearchState(), status: isDemo ? 'isolated-opening' : 'bundled', persistBlocked: false, error: '' };
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { return { state: isDemo ? initialState() : createBundledResearchState(), status: 'invalid-storage', persistBlocked: true, error: '本机存档无法解析，原始内容已保留，未覆盖保存。' }; }
  if (!validState(parsed)) return { state: isDemo ? initialState() : createBundledResearchState(), status: 'invalid-storage', persistBlocked: true, error: '本机存档格式不完整，原始内容已保留，未覆盖保存。' };
  const state = restore(raw);
  if (parsed.researchRoom && !state.researchRoom) return { state: parsed, status: 'restore-failed', persistBlocked: true, error: '本机存档未能完整恢复，原始内容已保留，未覆盖保存。' };
  if (isDemo || !isKnownIncompleteResearch(parsed)) return { state, status: 'preserved', persistBlocked: false, error: '' };
  return recoverConfirmedLegacyResearch({ state, raw, key, read, write });
}

// Called only after the exact compatibility check above. Kept separate so the
// backup transaction can be tested without distributing private browser exports.
export function recoverConfirmedLegacyResearch({ state, raw, key, read, write }) {
  const backupKey = legacyResearchBackupKey(key);
  try {
    const existing = read(backupKey);
    if (existing !== null && existing !== undefined && existing !== raw) throw Error('Different backup already exists');
    if (existing !== raw) write(backupKey, raw);
    if (read(backupKey) !== raw) throw Error('Backup could not be verified');
  } catch {
    return { state, status: 'backup-failed', persistBlocked: true, error: '旧存档备份未完成，已保留原记录，暂未加载完整演示。请先导出研究记录。' };
  }
  return { state: createBundledResearchState(state), status: 'legacy-recovered', persistBlocked: false, backupKey, error: '' };
}
