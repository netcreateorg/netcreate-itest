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
type NC_Unisys = {
  NewModule: (name: string) => NC_Module;
  NewDataLink: (mod: object, optName?: string) => NC_DataLink;
  RegisterMessagesPromise: (msgs: string[]) => Promise<any>;
  Hook: (phase: string, f: () => void) => void | Promise<void>;
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
const ERR_NONET = 'UNISYS instance not initialized';
let UNISYS: NC_Unisys;
let UMOD: NC_Module;
let UDATA: NC_DataLink;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REG_QUEUE: Array<NC_HandlerObj> = []; // for APP_READY hook
const REG_MESGS = [];

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by APP_READY hook to process the REG_QUEUE, as defined in
 *  InteropConnect() */
function m_ProcessMessageHandlerQueue() {
  while (REG_QUEUE.length > 0) {
    const qi = REG_QUEUE.shift();
    if (qi) {
      UDATA.HandleMessage(qi.msg, qi.hdl);
      if (!REG_MESGS.includes(qi.msg)) REG_MESGS.push(qi.msg);
    }
  }
  UNISYS.RegisterMessagesPromise(REG_MESGS);
}

/// MASTER SETUP //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register message handlers for NetCreate client in DOMContentLoaded
 *  handler in init.jsx */
function InteropConnect(unisys: NC_Unisys) {
  UNISYS = unisys;
  UMOD = UNISYS.NewModule('mur-interop');
  UDATA = UNISYS.NewDataLink(UMOD);
  // hook app_ready to register messages
  UNISYS.Hook('APP_READY', () => {
    LOG(...PR('APP_READY'));
    m_ProcessMessageHandlerQueue();
  });
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register messages at APP_READY, so call this before that happens */
function RegisterMessage(msg: NC_UMsg, hdl: NC_UHdl) {
  REG_QUEUE.push({ msg, hdl });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NetSend(msg: NC_UMsg, data: NC_Data) {
  if (UDATA === undefined) throw Error(ERR_NONET);
  UDATA.NetSend(msg, data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NetSignal(msg: NC_UMsg, data: NC_Data) {
  if (UDATA === undefined) throw Error(ERR_NONET);
  UDATA.NetSignal(msg, data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function NetCall(msg: NC_UMsg, data: NC_Data): Promise<NC_Data> {
  if (UDATA === undefined) throw Error(ERR_NONET);
  return UDATA.NetCall(msg, data);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // master setup called by init.jsx in DOMContentLoaded listener
  InteropConnect,
  // API methods
  RegisterMessage,
  NetSend,
  NetSignal,
  NetCall
};
