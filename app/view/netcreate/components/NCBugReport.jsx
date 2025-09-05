/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  # NCBugReport

  The `hidden` prop is used by the sytem to force open the bug report
  when the network is disconected.

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
const NOTLOGGEDIN = 'Not Logged In';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
function NCBugReport({ hidden }) {
  const [isOpen, setIsOpen] = useState(hidden);
  const [logInfo, setLogInfo] = useState({ logFilename: 'loading...' });
  const [token, setToken] = useState(NOTLOGGEDIN);

  useEffect(() => {
    // Get user token
    const { routeProps } = SETTINGS.GetRouteInfoFromURL();
    const token = (routeProps && routeProps.token) || NOTLOGGEDIN;
    setToken(token);
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

  useEffect(() => {
    setIsOpen(!hidden);
  }, [hidden]);

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
  return (
    <div style={{ visibility: isOpen ? 'visible' : 'hidden' }}>
      <URPopover
        title={`Bug Report ${new Date().toLocaleString()}`}
        onClose={ui_CloseBugReport}
        className="NCBugReport"
      >
        <i>Take a screenshot of the whole screen and send it to Net.Create staff.</i>
        <div className="key-value-pair">
          <label>Logged in as</label>
          <div>{token}</div>
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
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCBugReport;
