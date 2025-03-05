/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / NETCREATE INTEROPERABILITY
  
  This is a special bridge module for interoperation between MUR and the
  legacy NetCreate server.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TerminalLog } from '../common/util-prompts.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type NC_UMsg = `SRV_${string}`; // all uppercase
type NC_UPkt = { data: { [key: string]: any }; msg: string };
type NC_UHdl = (pkt: NC_UPkt) => any; // handler function
type NC_UEndP = {
  HandleMessage: (msg: NC_UMsg, hdl: NC_UHdl) => NC_UEndP;
  UnhandleMessage: (msg: NC_UMsg, hdl: NC_UHdl) => NC_UEndP;
};

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = TerminalLog('UR-NC', 'TagPink');

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register message handlers for NetCreate server */
function RegisterHandlers(UNET: NC_UEndP) {
  // add your handlers here
  // UNET.HandleMessage('SRV_SOMETHING', (pkt: NC_UPkt) => {});
  // LOG('would register handlers');
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  RegisterHandlers // called by server.js InitializeNetwork()
};
