/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  # NCBugReport

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import URPopover from './URPopover';
const SETTINGS = require('settings');
const GIT_INFO = require('../../../../app-config/git-info');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCBugReport' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
function NCBugReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [logInfo, setLogInfo] = useState({ logFilename: 'loading...' });

  useEffect(() => {
    UDATA.OnAppStateChange('PANELSTATE', evt_ToggleBugReport);

    // Get log info from server
    UDATA.Call('SRV_GET_LOG_INFO', {})
      .then(data => {
        setLogInfo(data);
      })
      .catch(err => {
        console.error('Failed to get log info:', err);
        setLogInfo({
          logFilename: 'error getting log info'
        });
      });

    return () => {
      UDATA.AppStateChangeOff('PANELSTATE', evt_ToggleBugReport);
    };
  }, []);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_ToggleBugReport(PANELSTATE) {
    setIsOpen(PANELSTATE.bugreportIsOpen);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_CloseBugReport() {
    const PANELSTATE = UDATA.AppState('PANELSTATE');
    UDATA.SetAppState('PANELSTATE', { ...PANELSTATE, bugreportIsOpen: false });
  }

  // COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  if (!isOpen) return null;

  return (
    <URPopover
      title={`Bug Report ${new Date().toLocaleString()}`}
      onClose={ui_CloseBugReport}
      classOverride="NCBugReport"
    >
      <i>Take a screenshot and send it to Net.Create staff.</i>
      <div className="key-value-pair">
        <label>Loki file</label>
        <div>{window.NC_CONFIG.dataset}.loki</div>
        <label>Template file</label>
        <div>{window.NC_CONFIG.dataset}.template.toml</div>
        <label>Git Branch</label>
        <div>
          {GIT_INFO.branch} {GIT_INFO.isDirty ? '(modified)' : ''}
        </div>
        <label>Git Commit</label>
        <div>
          {GIT_INFO.shortCommit} - {GIT_INFO.commitMessage}
        </div>
        <label>Build Time</label>
        <div>{GIT_INFO.buildTime}</div>
        <label>Log file</label>
        <div>{logInfo.logFilename}</div>
        <label>Server IP</label>
        <div>{SETTINGS.ServerHostIP()}</div>
        <label>UADDR</label>
        <div>{UNISYS.SocketUADDR()}</div>
      </div>
    </URPopover>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCBugReport;
