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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let TEMPLATE_DIR = ''; // template root directory
let RUNTIME_DIR = ''; // runtime root directory

/// RUNTIME_DIR INITIALIZATION ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this will register the message handler 'SRV_PSOP' for client-sourced
 *   operations */
NCI.QueueMessageRegistration('SRV_PSOP', pkt => {
  const { data } = pkt;
  const accessToken = pkt.accessToken;
  // todo: validate accessToken
  const { op, groupName, propObj, dotProp, value } = data;

  switch (op) {
    // manage op
    case 'get':
      return { settings: SETTINGS };

    case 'update':
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

    case 'persist':
      WriteDefaultSettings(data.filename);
      return { status: 'ok' }; // required by UNISYS network protocol

    default:
      return { error: `unknown operation: ${data.op}` }; // required by UNISYS network protocol
  }
});

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** either set or retrieve the reference root directory */
const u_root = (absPath?) => {
  if (typeof absPath === 'string') {
    if (!FILE.IsDir(absPath)) throw Error(`u_root: not a directory: ${absPath}`);
    TEMPLATE_DIR = absPath;
    return;
  }
  if (TEMPLATE_DIR === undefined) throw Error('u_root: TEMPLATE_DIR not initialized');
  return TEMPLATE_DIR;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** remove TEMPLATE_DIR prefix to return shortname */
const u_short = p => {
  if (TEMPLATE_DIR === undefined)
    throw Error('u_short: TEMPLATE_DIR not initialized');
  if (p.startsWith(TEMPLATE_DIR)) return p.slice(TEMPLATE_DIR.length + 1); // +1 for the slash
  return p; // return path as is if not in TEMPLATE_DIR
};

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
  // set the template root
  u_root(dir);
  // process files
  let detectedSchema = '';
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
  if (TEMPLATE_DIR === undefined) throw Error(`${fn} TEMPLATE_DIR not initialized`);
  fileName = fileName || '_default.template.yaml';
  const p = PATH.join(TEMPLATE_DIR, fileName);
  const doc = new Document(SETTINGS);
  const cmt = [
    '## GENERATED BY SETTING MANAGGER FROM MULTIPLE FILES',
    '## DO NOT EDIT THIS FILE DIRECTLY'
  ];
  doc.commentBefore = cmt.join('\n');
  const yaml = stringify(doc);
  FILE.WriteFile(p, yaml);
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
