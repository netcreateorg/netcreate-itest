/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Template Editor Manager

  This is the coutnerpart to the `template-schema.js` file, intended to
  manage the viewdata used for rendering the MURSettingEditor component.

  note: the canonical settings file is _default.template.toml

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import * as FILE from './file.mts';
import * as PATH from 'node:path';
import * as TEXT from '../common/util-text.ts';
import { parse, stringify, Document } from 'yaml';
import * as NCI from './nc-server-interop.mts';
import { TerminalLog } from '../common/util-prompts.ts';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const LOG = TerminalLog('SetMgr', 'TagPink');
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS = {
  _schemaVersion: '' // will be loaded
};

/// RUNTIME_DIR INITIALIZATION ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this will register the message handler 'SRV_PSOP' for client-sourced
 *   operations */
NCI.QueueMessageRegistration('SRV_PSOP', pkt => {
  const { data } = pkt;
  const accessToken = pkt.accessToken;
  // todo: validate accessToken

  const { op } = data;
  if (op === 'get') return PSOP_Get(pkt);
  if (op === 'update') return PSOP_Update(pkt);
  if (op === 'persist') return PSOP_Persist(pkt);
  return { error: `unknown operation: ${op}` }; // required by UNISYS network protocol
});

/// SRV_PSOP HANDLERS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PSOP_Get(pkt) {
  return { settings: SETTINGS }; // required by UNISYS network protocol
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PSOP_Update(pkt) {
  const { groupName, propObj, dotProp, value } = pkt.data;
  if (groupName && propObj) {
    LOG(`would update: ${groupName} ${JSON.stringify(propObj)}`);
  } else if (dotProp && value !== undefined) {
    if (!TEXT.IsDottedProperty(dotProp))
      return { error: `invalid dotProp '${dotProp}'` };
    LOG(`would update: ${dotProp} = ${value}`);
  } else {
    return { error: 'missing groupName/propObj or dotProp/value' };
  }
  return { status: 'ok' }; // required by UNISYS network protocol
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PSOP_Persist(pkt) {
  const filename = pkt.Data('filename');
  if (typeof filename !== 'string') return { error: `filename should be string` };
  WriteDefaultSettings(filename);
  return { status: 'ok' }; // required by UNISYS network protocol
}

/// API YAML METHODS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** loads all the matching .yaml files in order to create a composite settings
 *  object that is stored in its SETTINGS object */
function LoadSettings(dir) {
  const fn = 'LoadSettings:';
  if (dir === undefined) throw Error(`${fn} arg should be path string`);
  if (typeof dir !== 'string') throw Error(`${fn} arg should be string`);
  const files = [
    'props-proj-meta',
    'props-proj-pacl',
    'props-proj-settings',
    'props-citation',
    'base-types-comment',
    'base-values',
    'base-controls',
    'layout-edge',
    'layout-node',
    'layout-proj',
    'values-comment-prompts'
  ];
  // process files
  let detectedSchema = '';
  const u_short = NCI.ShortPath;
  files.forEach(f => {
    const p = PATH.join(dir, `${f}.yaml`);
    if (!FILE.FileExists(p)) {
      throw Error(`specified schema file not found: ${u_short(p)}`);
    }
    const yaml: string = FILE.ReadFile(p).toString();
    const { _key, _schemaVersion: _sch, ...obj } = parse(yaml, { merge: true });
    // detect schema version mismatch for this file
    if (!detectedSchema) detectedSchema = _sch;
    if (detectedSchema !== _sch) {
      const pfile = `'${files[0]}.yaml'`;
      const cfile = `'${u_short(p)}'`;
      LOG(`schema mismatch: ${cfile}: ${_sch} nomatch ${pfile}`);
      process.exit(1);
    }
    // check for _key and handle differently
    if (typeof _key === 'string' && _key.length > 0) {
      if (SETTINGS[_key] === undefined) SETTINGS[_key] = {};
      Object.assign(SETTINGS[_key], obj);
    } else Object.assign(SETTINGS, obj);
  });
  // after processing all files, update the schema version
  SETTINGS._schemaVersion = detectedSchema;
  return SETTINGS;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** write the current SETTINGS object as a YAML file to the template root */
function WriteDefaultSettings(fileName?) {
  const fn = 'WriteDefaultSettings:';
  const { templateDir } = NCI.GetPaths();
  fileName = fileName || '_default.template.yaml';
  const doc = new Document(SETTINGS);
  const cmt = [
    '## DO NOT EDIT THIS FILE DIRECTLY ##',
    '## Instead, edit the individual template files in the app-templates directory',
    '## to set the property declarations',
    '## Note that this is the data SCHEMA, not the data VALUES allowed by the schema.',
    '## Look in the runtime directory for the values file.'
  ];
  doc.commentBefore = cmt.join('\n');
  const yaml = stringify(doc);
  FILE.WriteFile(PATH.join(templateDir, fileName), yaml);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** write the incoming SETTINGS object values as a YAML file in the runtime
 *  root directory */
function WriteSettingsValues(settingsObj) {
  const fn = 'WriteSettingsValues:';
  const { runtimeDir, dataset } = NCI.GetPaths();
  LOG(`${fn} would write 'values-${dataset}.yaml' to '${runtimeDir}'`);
}

/// API GETTERS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** retrieve the settings object */
function Get() {
  return SETTINGS;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return layout metadata for a given groupName or all */
function GetLayoutDefs(groupName) {
  const layoutDefs = SETTINGS['LayoutDefs'];
  if (layoutDefs === undefined) return { error: `no LayoutDefs` };
  if (groupName === undefined) return { ...layoutDefs };
  if (typeof groupName !== 'string') return { error: `groupName must be string` };
  const found = layoutDefs[groupName];
  if (layoutDefs[groupName] === undefined && found)
    return {
      error: `make sure LayoutDefs follow PropertyDefs for ${groupName}`
    };
  return found || { error: `no LayoutDef for ${groupName}` };
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  LoadSettings, // (dir_yaml_settings_files) => obj
  WriteDefaultSettings, // (filename?) => void
  WriteSettingsValues, // (settings, filename?) => void
  Get, // () => obj
  GetLayoutDefs // (groupName?) => obj
};
