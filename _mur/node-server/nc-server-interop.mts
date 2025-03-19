/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / NETCREATE SERVER INTEROPERABILITY
  
  This is a special bridge module for interoperation between MUR and the
  legacy NetCreate server.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TerminalLog } from '../common/util-prompts.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: these types are not same as nc-client-interop.ts
type NC_UMsg = `SRV_${string}`; // all uppercase
type NC_Data = { [key: string]: any };
type NC_UPkt = NC_Data & { msg: NC_UMsg }; // packet
type NC_UHdl = (pkt: NC_UPkt) => any; // handler function
type NC_UEndP = {
  HandleMessage: (msg: NC_UMsg, hdl: NC_UHdl) => void;
  UnhandleMessage: (msg: NC_UMsg, hdl: NC_UHdl) => void;
  NetSignal: (msg: NC_UMsg, data: NC_Data) => void;
  NetSend: (msg: NC_UMsg, data: NC_Data) => void;
  NetCall: (msg: NC_UMsg, data: NC_Data) => Promise<NC_Data>;
};
type NC_HandlerObj = {
  msg: NC_UMsg;
  hdl: NC_UHdl;
};

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REG_QUEUE: Array<NC_HandlerObj> = []; // for APP_READY hook
const REG_MESGS = [];

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = TerminalLog('UR-NC', 'TagPink');
const ERR_NONET = 'UNET not initialized';
let UNET: NC_UEndP; // assigned by server.js InitializeNetwork()

/// MASTER SETUP //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register message handlers for NetCreate client in DOMContentLoaded
 *  handler in init.jsx */
function InteropConnect(endPoint: NC_UEndP) {
  const fn = 'InteropConnect';
  if (UNET !== undefined) throw Error(`${fn}: already initialized`);
  UNET = endPoint;
}

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by APP_READY hook to process the REG_QUEUE, as defined in
 *  InteropConnect() */
function RegisterHandlers() {
  while (REG_QUEUE.length > 0) {
    const qi = REG_QUEUE.shift();
    if (qi) {
      UNET.HandleMessage(qi.msg, qi.hdl);
      if (!REG_MESGS.includes(qi.msg)) REG_MESGS.push(qi.msg);
    }
  }
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register messages at APP_READY, so call this before that happens */
function QueueMessageRegistration(msg: NC_UMsg, hdl: NC_UHdl) {
  REG_QUEUE.push({ msg, hdl });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NetSend(msg: NC_UMsg, data: NC_Data) {
  if (UNET === undefined) throw Error(ERR_NONET);
  UNET.NetSend(msg, data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NetSignal(msg: NC_UMsg, data: NC_Data) {
  if (UNET === undefined) throw Error(ERR_NONET);
  UNET.NetSignal(msg, data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function NetCall(msg: NC_UMsg, data: NC_Data): Promise<NC_Data> {
  if (UNET === undefined) throw Error(ERR_NONET);
  return UNET.NetCall(msg, data);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  // master setup
  InteropConnect, // called from server InitializeNetwork()
  RegisterHandlers, // called from brunch-server before StartNetwork()
  // API methods
  QueueMessageRegistration,
  NetSend,
  NetSignal,
  NetCall
};
