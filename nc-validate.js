#!/usr/bin/env node

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  description

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const path = require('path');
const { ValidateTOMLTemplate } = require('./app/unisys/server-template-util.js');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Parse command line arguments
const args = process.argv.slice(2);
const script = path.basename(process.argv[1]);
let m_verbosity = 0;
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

/// RUNTIME ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!dataset) {
  ERR('No dataset specified');
  LOG(`Usage: ./${script} <dataset> [-v|-vv|-vvv]`);
  process.exit(1);
}
// Construct template file path
const defaultPath = path.join(__dirname, 'app-templates/_default.template.toml');
const datasetPath = path.join(__dirname, 'runtime', `${dataset}.template.toml`);

LOG('');
LOG('This utility will validate both the default template and the dataset template.');
LOG('For proper operation, both templates must be free of errors.');
LOG($yl('Use -v, -vv, or -vvv to adjust verbosity of reporting.'));
LOG('');

LOG('---');
LOG(`Validating ${$bl('default template')}: '${$short(defaultPath)}'`);
if (m_verbosity >= 1) LOG($yl(`verbosity level: ${m_verbosity}`));
LOG('');

const [defaultOK, defaultReport, defaultResults] = ValidateTOMLTemplate(defaultPath);

if (defaultOK) {
  LOG(`✅ Template '${$short(defaultPath)}' passed validation`);
} else {
  LOG(`❌ Template '${$short(defaultPath)}' failed validation`);
}
if (m_verbosity === 1) {
  LOG($yl('\nVALIDATION REPORT:'));
  LOG(defaultReport);
}
if (m_verbosity === 3) {
  LOG(`${$yl('VALID KEYS:')}\n  ${defaultResults.valid.join('\n  ')}`);
}
if (m_verbosity >= 2) {
  const invalid = defaultResults.invalid.join('\n  ') || '.';
  const extra = defaultResults.extra.join('\n  ') || '.';
  const missing = defaultResults.missing.join('\n  ') || '.';
  if (invalid) LOG(`${$yl('INVALID KEYS:')}\n  ${invalid}`);
  if (extra) LOG(`${$yl('EXTRA KEYS:')}\n  ${extra}`);
  if (missing) LOG(`${$yl('MISSING KEYS:')}\n  ${missing}`);
}

LOG('---');
LOG(`Validating ${$bl('dataset template')}: '${$short(datasetPath)}'`);
if (m_verbosity >= 1) LOG($yl(`verbosity level: ${m_verbosity}`));
LOG('');

const [datasetOK, datasetReport, datasetResults] = ValidateTOMLTemplate(datasetPath);

if (datasetOK) {
  LOG(`✅ Template '${$short(datasetPath)}' passed validation`);
} else {
  LOG(`❌ Template '${$short(datasetPath)}' failed validation`);
}
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
  if (invalid) LOG(`${$yl('INVALID KEYS:')}\n  ${invalid}`);
  if (extra) LOG(`${$yl('EXTRA KEYS:')}\n  ${extra}`);
  if (missing) LOG(`${$yl('MISSING KEYS:')}\n  ${missing}`);
}

LOG('');
