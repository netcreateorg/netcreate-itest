/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / SETTINGS CLIENTS
  this module connects with server-side mur-settings-mgr.mts module
  and stays in synch with it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as NCI from './nc-client-interop.ts';
import { ConsoleStyler } from '../common/util-prompts.ts';
import { EventMachine } from '../common/class-event-machine.ts';

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type { DataObj, OpResult } from '../_types/ursys.ts';
type SNA_EvtHandler = (evt: string, param: DataObj) => void;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('settings', 'TagCyan');
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SETTINGS: DataObj = undefined;
const EM = new EventMachine('settings_client');

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_HandlePSData(data: DataObj) {
  const fn = 'm_HandlePSData:';
  const { settings, group, prop } = data;

  /// case 1: settings is set
  if (settings !== undefined) {
    SETTINGS = settings;
    EM.emit('*', { ...settings });
    return;
  }

  /// case 2: group is set
  if (group !== undefined) {
    // { group: ...props }
    const groupNames = Object.keys(group);
    groupNames.forEach(gn => {
      const gset = group[gn];
      EM.emit(group, { ...gset });
    });
    Object.assign(SETTINGS, group);
    return;
  }

  /// case 3: prop is set
  if (prop !== undefined) {
    // prop is define { groupName.propName: value }
    const groupNames = Object.keys(prop);
    if (groupNames.length !== 1)
      throw Error('prop obj should only contain one group');
    let gpkey = groupNames[0];
    const [gkey, pkey, ...extra] = gpkey.split('.');
    if (extra.length > 0)
      throw Error('group.prop addressing only supports one level');
    if (SETTINGS[gkey] === undefined) SETTINGS[gkey] = {};
    Object.assign(SETTINGS[gkey], prop[gkey]);
    EM.emit(gpkey, { ...prop[gkey][pkey] });
    return;
  }

  /// case 4: nothing is set
  LOG(`${fn} no settings, group, or prop found in data`);
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return either the entire settings object, or a subkey */
async function Get(subkey?: string): Promise<OpResult> {
  const fn = 'Get:';
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
  if (DBG) LOG(...PR(`${fn} returning settings`), SETTINGS);
  return SETTINGS;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Subscribe setting change event. The scope is either * or a specific
 *  subkey of the settings object */
function Subscribe(scope: string = '*', evHdl: SNA_EvtHandler) {
  EM.on(scope, evHdl);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Unsubscribe from setting change event */
function Unsubscribe(scope: string = '*', evHdl: SNA_EvtHandler) {
  EM.off(scope, evHdl);
}

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this message is for server-pushed change. TODO: Validation */
NCI.QueueMessageRegistration('CLI_PSDATA', m_HandlePSData);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  //
  Get, // (subkey?: string) => Promise<OpResult>
  Subscribe, // (scope: string, evHdl: SNA_EvtHandler) => void
  Unsubscribe // (scope: string, evHdl: SNA_EvtHandler) => void
};
