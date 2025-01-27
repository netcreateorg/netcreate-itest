/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  LOGGER - WIP
  porting PLAE logger for now to get it minimally working

  SUPER UGLY PORT WILL CLEAN UP LATER AVERT YOUR EYES OMG

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/* eslint-disable newline-per-chained-call */
/* eslint-disable nonblock-statement-body-position */

/* added for pull request #81 so 'npm run lint' test appears clean */
/* eslint-disable no-unused-vars */

const PATH = require('path');
const FSE = require('fs-extra');
///
const NC_CONFIG = require('../../app-config/netcreate-config');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PROMPTS = require('../system/util/prompts');
const PR = PROMPTS.Pad('SRV-LOG');

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG_DIR = '../../runtime/logs';
const Tracer = require('tracer');
const LOG_DELIMITER = '\t';
const LOG_CONFIG = {
  format: '{{line}}  {{message}}',
  dateformat: 'HH:MM:ss.L',
  preprocess: function (data) {
    data.line = 'C ' + Number(data.line).zeroPad(4);
  }
};
const LOGGER = Tracer.colorConsole(LOG_CONFIG);
let fs_log = null;
// enums for outputing dates
const e_weekday = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// initialize event logger
var dir = PATH.resolve(PATH.join(__dirname, LOG_DIR));
FSE.ensureDir(dir, function (err) {
  if (err) throw new Error('could not make ' + dir + ' directory');
  var logname = str_TimeDatedFilename('log') + '.txt';
  var pathname = dir + '/' + logname;
  fs_log = FSE.createWriteStream(pathname);

  // Show Research Log Field Names
  const fieldnames = [
    'Date', 'Time', 'NetName', 'Addr', 'Token', 'Action', 'DataID', 'DataDetail'
  ];
  let fields = fieldnames.join(LOG_DELIMITER);
  fields += '\n';
  fs_log.write(fields);

  LogResearchLine({},
    `NETCREATE APPSERVER SESSION LOG for ${str_DateStamp()} ${str_TimeStamp()}`
  );
  LogResearchLine({}, '---');
});

/// LOGGING FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Log a standard system log message
 */
function LogLine(...args) {
  if (!fs_log) return;

  var out = str_ShortDateStamp() + LOG_DELIMITER;
  out += str_TimeStamp() + LOG_DELIMITER;
  out += NC_CONFIG.dataset + LOG_DELIMITER;
  var c = args.length;
  // arguments are delimited
  if (c) {
    for (let i = 0; i < c; i++) {
      if (i > 0) out += LOG_DELIMITER;
      out += args[i];
    }
  }
  out += '\n';
  fs_log.write(out);
}

/** Log a standard structured log message for research
 *  Guarantees a predictable column order with
 *    date, time, network, uaddr, group
 */
function LogResearchLine(info = { uaddr: '', group: '' }, ...args) {
  if (!fs_log) return;

  var out = str_ShortDateStamp() + LOG_DELIMITER;
  out += str_TimeStamp() + LOG_DELIMITER;
  out += NC_CONFIG.dataset + LOG_DELIMITER;
  out += (info.uaddr || '-') + LOG_DELIMITER;
  out += (info.group || '-') + LOG_DELIMITER;
  var c = args.length;
  // arguments are delimited
  if (c) {
    for (let i = 0; i < c; i++) {
      if (i > 0) out += LOG_DELIMITER;
      out += args[i];
    }
  }
  out += '\n';
  fs_log.write(out);
}

/// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function str_TimeStamp() {
  var date = new Date();
  var hh = ('0' + date.getHours()).slice(-2);
  var mm = ('0' + date.getMinutes()).slice(-2);
  var ss = ('0' + date.getSeconds()).slice(-2);
  return hh + ':' + mm + ':' + ss;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function str_DateStamp() {
  var date = new Date();
  var mm = ('0' + (date.getMonth() + 1)).slice(-2);
  var dd = ('0' + date.getDate()).slice(-2);
  var day = e_weekday[date.getDay()];
  var yyyy = date.getFullYear();
  return yyyy + '/' + mm + '/' + dd + ' ' + day;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function str_ShortDateStamp() {
  var date = new Date();
  var mm = ('0' + (date.getMonth() + 1)).slice(-2);
  var dd = ('0' + date.getDate()).slice(-2);
  var day = e_weekday[date.getDay()];
  var yyyy = date.getFullYear();
  return yyyy + '/' + mm + '/' + dd;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function str_TimeDatedFilename(...args) {
  // construct filename
  var date = new Date();
  var dd = ('0' + date.getDate()).slice(-2);
  var mm = ('0' + (date.getMonth() + 1)).slice(-2);
  var hms = ('0' + date.getHours()).slice(-2);
  hms += ('0' + date.getMinutes()).slice(-2);
  hms += ('0' + date.getSeconds()).slice(-2);
  var filename;
  filename = date.getFullYear().toString();
  filename += '-' + mm + dd;
  var c = arguments.length;
  if (c) filename += filename.concat('-', ...args);
  filename += '-' + hms;
  return filename;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let LOG = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Handle incoming log events
 */
LOG.PKT_LogEvent = function (pkt) {
  let { event, items } = pkt.Data();
  const uaddr = pkt.SourceAddress();
  const group = pkt.SourceGroupID(); // leave blank if empty for network events
  if (DBG) console.log(PR, pkt.Info(), event, ...items);
  LogResearchLine({ uaddr, group }, event || '-', ...items);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Write to log as delimited arguments
 */
LOG.Write = LogLine;
/** API: Write to Researcher log as delimited arguments
 *  Research logs alway start with date, time, network, uaddr, group
 */
LOG.WriteRLog = function (info = { uaddr: '', group: '' }, ...args) {
  LogResearchLine(info, ...args);
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = LOG;
