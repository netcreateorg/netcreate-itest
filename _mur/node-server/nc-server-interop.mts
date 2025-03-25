/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / NETCREATE SERVER INTEROPERABILITY
  
  This is a special bridge module for interoperation between MUR and the
  legacy NetCreate server.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TerminalLog } from '../common/util-prompts.ts';
import * as FILE from './file.mts';
import * as PATH from 'node:path';

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
type NC_ConfigObj = {
  dataset: string;
};

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = TerminalLog('UR-NC', 'TagPink');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let UNET: NC_UEndP; // assigned by server.js InitializeNetwork()
let NC_CONFIG: NC_ConfigObj; // assigned by server.js InitializeNetwork()
let ROOT_DIR: string;
let TEMPLATE_DIR: string;
let RUNTIME_DIR: string;
let DATASET: string;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let REG_QUEUE: Array<NC_HandlerObj> = []; // for APP_READY hook
const REG_MESGS = [];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ERR_NONET = 'UNET not initialized';

/// MASTER SETUP //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register message handlers for NetCreate client in DOMContentLoaded
 *  handler in init.jsx */
function InteropConnect(endPoint: NC_UEndP, ncConfig: NC_ConfigObj) {
  const fn = 'InteropConnect';
  if (typeof ncConfig?.dataset !== 'string') throw Error(`${fn}: missing dataset`);
  if (UNET !== undefined) throw Error(`${fn}: already initialized`);
  UNET = endPoint;
  NC_CONFIG = ncConfig;
  const { dataset } = ncConfig;
  ROOT_DIR = FILE.DetectedRootDir();
  TEMPLATE_DIR = PATH.join(ROOT_DIR, 'app-templates');
  RUNTIME_DIR = PATH.join(ROOT_DIR, 'runtime');
  DATASET = dataset;
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

/// ENVIRONMENT METHODS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the paths to the root, template, and runtime directories, which
 *  are valid after InteropConnect() is called */
function GetPaths() {
  if (ROOT_DIR === '') throw Error('ROOT_DIR not initialized');
  return {
    rootDir: ROOT_DIR,
    templateDir: TEMPLATE_DIR,
    runtimeDir: RUNTIME_DIR,
    dataset: DATASET
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the short path for a given file or directory by truncating the
 *  most common path prefix */
function ShortPath(path: string) {
  const fn = 'ShortPath:';
  if (TEMPLATE_DIR === undefined) throw Error(`${fn} TEMPLATE_DIR not initialized`);
  if (path.startsWith(TEMPLATE_DIR)) return path.slice(TEMPLATE_DIR.length + 1);
  if (path.startsWith(RUNTIME_DIR)) return path.slice(RUNTIME_DIR.length + 1);
  if (path.startsWith(ROOT_DIR)) return path.slice(ROOT_DIR.length + 1);
  return path;
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
  // Environment methods
  GetPaths, // () => { rootDir, templateDir, runtimeDir, dataset }
  ShortPath, // (path: string) => string
  // API methods
  QueueMessageRegistration,
  NetSend,
  NetSignal,
  NetCall
};
