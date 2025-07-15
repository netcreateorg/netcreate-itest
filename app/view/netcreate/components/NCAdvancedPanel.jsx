/* eslint-disable react/no-unescaped-entities */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  # NCAdvancedPanel

  NCAdvancedPanel handles:
  - Template Import/Export
  - Node/Edge Import/Export
  - User Tokens
  - Admin Password

  By default, only Export nodes/edges is enabled for normal users.
  (The "Import/Export" tab will display "Export" only).
  The other functions are admin-only.


  ### PERMISSIONS App State

  The `PERMISSIONS` app state is used to track the admin permissions.
  This app state is used by NCNode, NCEdge, NCImportExport to
  enable/disable admin-only features.

  REVIEW: This probably should be moved to a permissions manager.


  ### Admin Password

  Only administrators (teachers) can manage templates, import data, and manage
  user tokens.

  The admin password is defined in the project template with the `adminPassword`
  property and is not visible to students.

  Admin features will be enabled as soon as you enter the correct password.
  (You don't need to hit return).  When the password is validated, the input
  form will turn into a "Reset Password"


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import NCImportExport from './NCImportExport';
import NCTemplate from './NCTemplate';
import NCUserTokens from './NCUserTokens';
import MURSettingEditor from './MURSettingsEditor';
import URPopover from './URPopover';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCAdvancedPanel' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const VIEWS = {
  template: 'Template',
  importexport: 'Import/Export',
  usertokens: 'User Tokens',
  settings: 'Settings'
};

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
function NCAdvancedPanel() {
  // HACK MAKE SURE TO CHANGE BACK BEFORE PR SUBMISSION -
  // this completely bypasses the adminPassword checks //
  let isOpen, setIsOpen;
  let openTab, setOpenTab;
  if (!DBG) {
    [isOpen, setIsOpen] = useState(false);
    [openTab, setOpenTab] = useState('importexport');
  } else {
    [isOpen, setIsOpen] = useState(true);
    [openTab, setOpenTab] = useState('settings');
  }
  // HACK MAKE SURE TO CHANGE BACK BEFORE PR SUBMISSION -
  const [password, setPassword] = useState('');
  const [hasAdminPermissions, setHasAdminPermissions] = useState(undefined);

  useEffect(() => {
    const PERMISSIONS = UDATA.AppState('PERMISSIONS');
    UDATA.SetAppState('PERMISSIONS', {
      ...PERMISSIONS,
      isAdmin: hasAdminPermissions
    });

    UDATA.OnAppStateChange('PANELSTATE', evt_ToggleAdvanced);
    assessAdminPrivileges();
    return () => {
      UDATA.AppStateChangeOff('PANELSTATE', evt_ToggleAdvanced);
    };
  }, []);

  useEffect(() => {
    assessAdminPrivileges();
  }, [password]);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_ToggleAdvanced(PANELSTATE) {
    setIsOpen(PANELSTATE.advancedIsOpen);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function assessAdminPrivileges() {
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    if (TEMPLATE && TEMPLATE.adminPassword === undefined)
      console.warn(
        'No admin password defined!  Please set it if you need admin access'
      );
    const isAdmin =
      TEMPLATE && TEMPLATE.adminPassword && TEMPLATE.adminPassword === password;
    if (!DBG) setHasAdminPermissions(isAdmin);
    // HACK: disable admin password for prop-settings-2
    else {
      console.log(
        '%c*** DBG Mode: AdminPassword Bypassed ***',
        'color: red; font-weight: bold;'
      );
      setHasAdminPermissions(true);
    }
    // HACK END

    const PERMISSIONS = UDATA.AppState('PERMISSIONS');
    UDATA.SetAppState('PERMISSIONS', { ...PERMISSIONS, isAdmin });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_CloseAdvanced() {
    const PANELSTATE = UDATA.AppState('PANELSTATE');
    UDATA.SetAppState('PANELSTATE', { ...PANELSTATE, advancedIsOpen: false });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_SelectTab(tab) {
    setOpenTab(tab);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_PasswordChange(e) {
    const password = e.target.value;
    setPassword(password);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_PasswordClear() {
    setPassword('');
  }

  // COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const TABS = hasAdminPermissions
    ? VIEWS // show all tabs to admin
    : { export: 'Export' }; // show "Export" only

  let jsx;
  switch (openTab) {
    case 'template':
      jsx = <NCTemplate />;
      break;
    case 'importexport':
    case 'export':
      jsx = <NCImportExport isAdmin={hasAdminPermissions} />;
      break;
    case 'usertokens':
      jsx = <NCUserTokens />;
      break;
    case 'settings':
      jsx = <MURSettingEditor />;
      break;
    default:
      break;
  }

  if (!isOpen) return null;

  let adminStatus;
  if (hasAdminPermissions === undefined) {
    adminStatus = <span>Admin Mode Disabled</span>;
    console.log(`NOTE: "adminPassword" is not set (premature mount?)`);
  } else if (hasAdminPermissions === false)
    adminStatus = (
      <label>
        admin: <input type="password" id="password" onChange={ui_PasswordChange} />
      </label>
    );
  else if (hasAdminPermissions === true)
    adminStatus = (
      <button type="button" onClick={ui_PasswordClear}>
        Admin Logout
      </button>
    );

  return (
    <URPopover title="Advanced" onClose={ui_CloseAdvanced}>
      <div id="NCTabPanel" className="NCAdvancedPanel">
        <div className="tabs" role="tablist">
          {Object.keys(TABS).map(k => (
            <button
              key={k}
              role="tab"
              className={openTab === k ? 'selected' : ''}
              aria-selected={openTab === k}
              aria-controls={k}
              tabIndex={openTab === k ? '0' : '-1'}
              onClick={() => ui_SelectTab(k)}
            >
              {TABS[k]}
            </button>
          ))}
        </div>

        <div className="tabpanels">{jsx}</div>

        <div className="footer">{adminStatus}</div>
      </div>
    </URPopover>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCAdvancedPanel;
