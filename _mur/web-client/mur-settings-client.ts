/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS-MIN (MUR) / SETTINGS CLIENTS
  this module connects with server-side mur-settings-mgr.mts module
  and stays in synch with it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as NCI from './nc-client-interop.ts';
import { ConsoleStyler } from '../common/util-prompts.ts';
import { EventMachine } from '../common/class-event-machine.ts';
import { SettingsContext } from './mur-settings-context.ts'; // for React context

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import type { DataObj, OpResult } from '../_types/ursys.ts';
type SNA_EvtHandler = (evt: string, param: DataObj) => void;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('settings', 'TagCyan');
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let SETTINGS: DataObj = {};
const EM = new EventMachine('settings_client');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NCI.QueueHook('LOADASSETS', async () => {
  const fn = 'LOADASSETS:';
  const data = await NCI.NetCall('SRV_PSOP', { op: 'get' });
  if (data.error) throw Error(`${fn} ${data.error}`);
  if (data.settings === undefined) throw Error(`${fn} no settings found in data`);
  if (Object.keys(data.settings).length === 0)
    console.warn(`${fn} received empty settings object`, data);
  SETTINGS = data.settings;
});

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this code block will run as soon as the module is loaded */
(async () => {
  // register for settings server push messages
  NCI.QueueMessageRegistration('CLI_PSDATA', m_ReceiveServerChanges);
})();

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** handle incoming settings change from the server */
function m_ReceiveServerChanges(data: DataObj) {
  if (DBG) LOG(...PR(`client received update`), data);

  // case 1: group set of properties
  const { groupName, propObj } = data; // update group
  if (groupName && propObj) {
    const groupObj = SETTINGS[groupName];
    if (groupObj === undefined) SETTINGS[groupName] = {};
    Object.assign(SETTINGS[groupName], propObj);
    EM.emit(groupName, propObj);
    EM.emit('*', { [groupName]: propObj });
    return;
  }

  // case 2: single property update
  const { dotProp, value } = data; // update property
  if (dotProp !== undefined && value !== undefined) {
    const [gkey, pkey] = dotProp.split('.');
    if (SETTINGS[gkey] === undefined) SETTINGS[gkey] = {};
    if (SETTINGS[gkey][pkey] === undefined) SETTINGS[gkey][pkey] = {};
    Object.assign(SETTINGS[gkey][pkey], value);
    EM.emit(dotProp, value);
    EM.emit('*', { [gkey]: { [pkey]: value } });
    return;
  }

  // case 3: full settings update
  const { settings } = data; // update all settings
  if (settings !== undefined) {
    SETTINGS = Object.assign(SETTINGS, settings);
    EM.emit('*', settings);
    return;
  }

  /// case 4: nothing is set
  throw Error(`server pushed unknown data format`, data);
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return either the entire settings object, or a subkey */
function Get(subkey?: string): OpResult {
  const fn = 'Get:';
  if (typeof subkey === 'string' && subkey.length > 0) {
    if (SETTINGS[subkey] !== undefined) return SETTINGS[subkey];
    return { error: `subkey '${subkey}' not found in settings` };
  }
  return SETTINGS;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: update a single property in the settings object to the server
 *  which will then push the change to all clients */
async function UpdateProperty(dotProp: string, value: any) {
  if (DBG) LOG(...PR(`client push property update`, { dotProp, value }));
  const opResult = await NCI.NetCall('SRV_PSOP', { op: 'update', dotProp, value });
  return opResult;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: update a group of properties in the settings object to the server
 *  which will then push the change to all clients */
async function UpdateGroup(groupName: string, propObj: DataObj) {
  if (DBG) LOG(...PR(`client push group update`, { groupName, propObj }));
  const opResult = await NCI.NetCall('SRV_PSOP', {
    op: 'update',
    groupName,
    propObj
  });
  return opResult;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Subscribe to setting change event. The scope is either * or a specific
 *  subkey of the settings object */
function Subscribe(scope: string = '*', evHdl: SNA_EvtHandler) {
  EM.on(scope, evHdl);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Unsubscribe from setting change event */
function Unsubscribe(scope: string = '*', evHdl: SNA_EvtHandler) {
  EM.off(scope, evHdl);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Getter for the settings context for React usage */
function GetContext() {
  return SettingsContext;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  //
  Get, // (subkey?: string) => Promise<OpResult>
  UpdateProperty, //
  UpdateGroup,
  //
  Subscribe, // (scope: string, evHdl: SNA_EvtHandler) => void
  Unsubscribe, // (scope: string, evHdl: SNA_EvtHandler) => void
  //
  GetContext // for React context usage
};
