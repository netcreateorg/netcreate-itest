/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / SETTINGS CLIENTS
  this module connects with server-side mur-setting-mgr.mts module
  and stays in synch with it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as NCI from './nc-client-interop.ts';
import { ConsoleStyler } from '../common/util-prompts.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type { DataObj, OpResult } from '../_types/ursys.d.ts';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('settings', 'TagCyan');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SETTINGS: DataObj = undefined;

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return either the entire settings object, or a subkey */
async function GetSettings(subkey?: string): Promise<OpResult> {
  const fn = 'GetSettings:';
  if (SETTINGS === undefined) {
    const data = await NCI.NetCall('SRV_PSOP', { op: 'get' });
    if (data.error) throw Error(`${fn} ${data.error}`);
    if (data.settings === undefined) throw Error(`${fn} no settings found in data`);
    SETTINGS = data.settings;
  }
  if (typeof subkey === 'string' && subkey.length > 0) {
    if (SETTINGS[subkey] !== undefined) return SETTINGS[subkey];
    return { error: `subkey '${subkey}' not found in settings` };
  }
  LOG(...PR(`${fn} returning settings`), SETTINGS);
  return SETTINGS;
}

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NCI.QueueMessageRegistration('SRV_PSOP', data => {
  if (data.settings) {
    Object.assign(SETTINGS, data.settings);
  }
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  //
  GetSettings // (subkey?: string) => Promise<OpResult>
};
