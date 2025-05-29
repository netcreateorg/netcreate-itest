/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / NETCREATE CLIENT INTEROPERABILITY
  
  This is a special bridge module for interoperation between MUR and the
  legacy NetCreate server.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { ConsoleStyler } from '../common/util-prompts.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: these types are not same as server nc-interop.mts
type NC_UMsg = string; // all uppercase, SRV_ or CLI_
type NC_Data = { [key: string]: any };
type NC_UHdl = (data: NC_Data) => any; // handler function
type NC_DataLink = {
  HandleMessage: (msg: NC_UMsg, hdl: NC_UHdl) => void;
  UnhandleMessage: (msg: NC_UMsg, hdl: NC_UHdl) => void;
  NetSignal: (msg: NC_UMsg, data: NC_Data) => void;
  NetSend: (msg: NC_UMsg, data: NC_Data) => void;
  NetCall: (msg: NC_UMsg, data: NC_Data) => Promise<NC_Data>;
};
type NC_HookFunction = () => void | Promise<void>;
type NC_Unisys = {
  NewModule: (name: string) => NC_Module;
  NewDataLink: (mod: object, optName?: string) => NC_DataLink;
  RegisterMessagesPromise: (msgs: string[]) => Promise<any>;
  Hook: (phase: string, hookFunc: NC_HookFunction) => void;
  CurrentPhase: () => string;
};
type NC_Module = {
  uid: string;
};
type NC_HandlerObj = {
  msg: NC_UMsg;
  hdl: NC_UHdl;
};

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('interop', 'TagPink');
let DBG = true;
const ERR_NONET = 'UDATA instance not initialized';
const ERR_NOSYS = 'UNISYS instance not initialized';
const ERR_LATE = 'Cannot queue hook after InteropConnect';
let UNISYS: NC_Unisys;
let UMOD: NC_Module;
let UDATA: NC_DataLink;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REG_QUEUE: Array<NC_HandlerObj> = []; // for APP_READY hook
const REG_MESGS = [];
const HOOK_QUEUE: Array<{ phase: string; hookFunc: NC_HookFunction }> = [];

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by APP_READY hook to process the REG_QUEUE, as defined in
 *  InteropConnect() */
function m_ProcessRegistrationQueue() {
  while (REG_QUEUE.length > 0) {
    const qi = REG_QUEUE.shift();
    if (qi) {
      UDATA.HandleMessage(qi.msg, qi.hdl);
      if (DBG) LOG(...PR('registering', qi.msg));
      if (!REG_MESGS.includes(qi.msg)) REG_MESGS.push(qi.msg);
    }
  }
  UNISYS.RegisterMessagesPromise(REG_MESGS);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called after the network is ready to process the HOOK_QUEUE during the
 *  InteropConnect() call in init.jsx before joining the network */
function m_ProcessHookQueue() {
  // LOG(...PR(`current phase: ${UNISYS.CurrentPhase()}`));
  while (HOOK_QUEUE.length > 0) {
    const qi = HOOK_QUEUE.shift();
    if (qi) {
      UNISYS.Hook(qi.phase, qi.hookFunc);
      if (DBG) LOG(...PR('hooking', qi.phase));
    }
  }
}

/// MASTER SETUP //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register message handlers for NetCreate client in DOMContentLoaded
 *  handler in init.jsx */
function InteropConnect(unisys: NC_Unisys) {
  LOG(...PR('InteropConnect'));
  UNISYS = unisys;
  UMOD = UNISYS.NewModule('mur-interop');
  UDATA = UNISYS.NewDataLink(UMOD);
  // initialize the hooks
  m_ProcessHookQueue();
  // hook app_ready to register messages
  Hook('APP_READY', () => {
    // process queued interop message handler reqs
    m_ProcessRegistrationQueue();
  });
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register messages at APP_READY, so call this before that happens */
function QueueMessageRegistration(msg: NC_UMsg, hdl: NC_UHdl) {
  REG_QUEUE.push({ msg, hdl });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NetSend(msg: NC_UMsg, data: NC_Data) {
  if (UDATA === undefined) throw Error(`NetSend ${ERR_NONET}`);
  UDATA.NetSend(msg, data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NetSignal(msg: NC_UMsg, data: NC_Data) {
  if (UDATA === undefined) throw Error(`NetSignal ${ERR_NONET}`);
  UDATA.NetSignal(msg, data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function NetCall(msg: NC_UMsg, data: NC_Data): Promise<NC_Data> {
  if (UDATA === undefined) throw Error(`NetCall ${ERR_NONET}`);
  return UDATA.NetCall(msg, data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Hook(phase: string, hookFunc: NC_HookFunction) {
  if (UNISYS === undefined) throw Error(`Hook ${ERR_NOSYS}`);
  UNISYS.Hook(phase, hookFunc);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function QueueHook(phase: string, hookFunc: NC_HookFunction) {
  if (UNISYS !== undefined) throw Error(`QueueHook ${ERR_LATE}`);
  HOOK_QUEUE.push({ phase, hookFunc });
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // master setup called by init.jsx in DOMContentLoaded listener
  InteropConnect,
  // API methods
  QueueMessageRegistration,
  NetSend,
  NetSignal,
  NetCall,
  Hook,
  QueueHook
};
