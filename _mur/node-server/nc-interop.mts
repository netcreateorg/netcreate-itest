/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / NETCREATE SERVER INTEROPERABILITY
  
  This is a special bridge module for interoperation between MUR and the
  legacy NetCreate server.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TerminalLog } from '../common/util-prompts.ts';
import { GetSettings } from './mur-setting-mgr.mts';

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

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = TerminalLog('UR-NC', 'TagPink');
const ERR_NONET = 'UNET not initialized';
let UNET: NC_UEndP; // assigned by server.js InitializeNetwork()

/// HELPER METHODS ////////////////////////////////////////////////////////////
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

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register message handlers for NetCreate server, called via
 *  patch to UNISYS.RegisterHandlers() in server.js */
function RegisterHandlers(unisysEndpoint: NC_UEndP) {
  UNET = unisysEndpoint;
  UNET.HandleMessage('SRV_PSOP', (pkt: NC_UPkt) => {
    LOG('Received SRV_PSOP:', pkt.data);
    const settings = GetSettings();
    return { settings };
  });
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  RegisterHandlers, // called by server.js RegisterHandlers()
  NetSend,
  NetSignal,
  NetCall
};
