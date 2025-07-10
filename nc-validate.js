#!/usr/bin/env node

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Validates the TEMPLATE structure defined by toml template files

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const path = require('path');
const { GetTOMLValidation } = require('./app/unisys/server-template-util.js');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Parse command line arguments
const args = process.argv.slice(2);
const script = path.basename(process.argv[1]);
let m_verbosity = 0;
let m_default_only = false;
//
if (args.includes('-vvv')) m_verbosity = 3;
else if (args.includes('-vv')) m_verbosity = 2;
else if (args.includes('-v')) m_verbosity = 1;
const dataset = args.find(arg => !arg.startsWith('-'));
const LOG = console.log.bind(console);
const ERR = console.error.bind(console);

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns a shortened path for display purposes. */
function $short(path) {
  if (path.startsWith(__dirname)) return path.slice(__dirname.length + 1);
  return path;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return string wrapped with ANSI terminal bright blue */
function $bl(string) {
  return `\x1b[1;34m${string}\x1b[0m`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return string wrapped with ANSI terminal bright yellow */
function $yl(string) {
  return `\x1b[1;33m${string}\x1b[0m`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return bright white string */
function $wh(string) {
  return `\x1b[1;37m${string}\x1b[0m`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return bright white string with bright blue background */
function $bb(string) {
  return `\x1b[1;37;44m(${string})\x1b[0m`;
}

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!dataset) m_default_only = true;

// Construct template file path
const defaultPath = path.join(__dirname, 'app-templates/_default.template.toml');
const datasetPath = path.join(__dirname, 'runtime', `${dataset}.template.toml`);

LOG('');
LOG('This utility will validate the default template and a dataset template.');
LOG('For proper NetCreate operation, both templates must be free of errors.');
if (!dataset) {
  LOG($yl('\nNo dataset specified, will only validate the default template.'));
  LOG(
    '\nSYNTAX:',
    $wh('\n  nc-validate.js [-v|-vv|-vvv] [dataset-name-no-extension]')
  );
}
LOG('');
if (m_verbosity >= 1) LOG('[using', $yl(`verbosity level: ${m_verbosity}`), ']');

LOG('---');
LOG(`${$bb(1)} Validating ${$bl('DEFAULT')} template: '${$short(defaultPath)}'`);

const [defaultOK, defaultReport, defaultResults] = GetTOMLValidation(defaultPath);
const dt_num = defaultResults.valid.length;
const dt_vari = defaultResults.varies.length;

/// DEFAULT TEMPLATE VALIDATION REPORT ///

if (m_verbosity === 0 && !defaultOK) {
  LOG(`❌ Template '${$short(defaultPath)}' failed validation`);
}
if (m_verbosity > 0) LOG('');
if (m_verbosity > 0) {
  if (!defaultOK) LOG(`❌ Template '${$short(defaultPath)}' failed validation`);
  else LOG(`✅ Template '${$short(defaultPath)}' passed validation`);
  LOG('');
}
if (m_verbosity === 1) {
  LOG($yl('\nVALIDATION REPORT:'));
  LOG(defaultReport);
}
// extra logging for higher levels
if (m_verbosity === 3) {
  LOG(`${$yl('VALID KEYS:')}\n  ${defaultResults.valid.join('\n  ')}`);
}
if (m_verbosity >= 2) {
  const invalid = defaultResults.invalid.join('\n  ') || '.';
  const extra = defaultResults.extra.join('\n  ') || '.';
  const missing = defaultResults.missing.join('\n  ') || '.';
  const varies = defaultResults.varies.join('\n  ') || '.';
  const warnings = defaultResults.warnings
    ? defaultResults.warnings.join('\n  ') || '.'
    : '.';
  if (invalid) LOG(`${$yl('INVALID KEYS:')}\n  ${invalid}`);
  if (extra) LOG(`${$yl('EXTRA KEYS:')}\n  ${extra}`);
  if (missing) LOG(`${$yl('MISSING KEYS:')}\n  ${missing}`);
  if (m_verbosity > 2 && varies) LOG(`${$yl('VARIABLE KEYS:')}\n  ${varies}`);
  // Note: 'warnings' is optional, so we check if it exists before logging
  if (warnings && warnings !== '.') LOG(`${$yl('WARNINGS:')}\n  ${warnings}`);
}

// if no dataset specified, exit after validating default template
if (m_default_only) {
  LOG('');
  process.exit(0);
}

/// DATASET TEMPLATE VALIDATION REPORT ///

LOG('---');
LOG(`${$bb(2)} Validating ${$bl('DATASET')} template: '${$short(datasetPath)}'`);
LOG('');

const [datasetOK, datasetReport, datasetResults] = GetTOMLValidation(datasetPath);
const ds_num = datasetResults.valid.length;
const ds_vari = datasetResults.varies.length;

if (datasetOK) {
  LOG(`✅ Template '${$short(datasetPath)}' passed validation`);
} else {
  LOG(`❌ Template '${$short(datasetPath)}' failed validation`);
}
if (m_verbosity > 0) LOG('');
if (m_verbosity === 1) {
  LOG($yl('\nVALIDATION REPORT:'));
  LOG(datasetReport);
}
if (m_verbosity === 3) {
  LOG(`${$yl('VALID KEYS:')}\n  ${datasetResults.valid.join('\n  ')}`);
}
if (m_verbosity >= 2) {
  const invalid = datasetResults.invalid.join('\n  ') || '.';
  const extra = datasetResults.extra.join('\n  ') || '.';
  const missing = datasetResults.missing.join('\n  ') || '.';
  const varies = datasetResults.varies.join('\n  ') || '.';
  if (dt_num !== ds_num) {
    const dt = $yl(dt_num);
    const ds = $yl(ds_num);
    const dv = $yl(dt_vari);
    const sv = $yl(ds_vari);
    const warn = `? validated keys count mismatch: default ${dt} !== ${ds} dataset`;
    datasetResults.warnings.push(warn);
  }
  const warnings = datasetResults.warnings
    ? datasetResults.warnings.join('\n  ') || '.'
    : '.';
  if (invalid) LOG(`${$yl('INVALID KEYS:')}\n  ${invalid}`);
  if (extra) LOG(`${$yl('EXTRA KEYS:')}\n  ${extra}`);
  if (missing) LOG(`${$yl('MISSING KEYS:')}\n  ${missing}`);
  if (m_verbosity > 2 && varies) LOG(`${$yl('VARIABLE KEYS:')}\n  ${varies}`);
  if (warnings && warnings !== '.') LOG(`${$yl('WARNINGS:')}\n  ${warnings}`);
}

LOG('');
