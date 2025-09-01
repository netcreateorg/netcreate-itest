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


  ### Template Lock

  The template lock is a mechanism that prevents multiple users from editing the same template simultaneously.
  When a user wants to edit a template, they must first acquire a lock on it. If the lock is successful, they can proceed with editing.
  If the lock fails, it means another user is already editing the template.

  Templates are also locked when a user is editing a node or edge to prevent accidental overwrites.

  The lock is released automatically when the user is done editing or if they navigate away from the template.

  Conditions:
  - Anyone is editing a Node or Edge
  - I am an admin, or someone else is an admin and
    - has the import/export panel open
    - has the template panel open
    - has the settings panel open

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import NCImportExport from './NCImportExport';
import NCTemplate from './NCTemplate';
import NCUserTokens from './NCUserTokens';
import MURSettingEditor from './MURSettingsEditor';
import URPopover from './URPopover';
const RSB = require('./react-settings-bridge');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCAdvancedPanel' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCAdvancedPanel';
const TABS = {
  IMPORT_EXPORT: {
    id: 'importexport',
    label: 'Import/Export',
    adminRequired: true
  },
  TEMPLATE: {
    id: 'template',
    label: 'Template',
    adminRequired: true
  },
  SETTINGS: {
    id: 'settings',
    label: 'Settings',
    adminRequired: true
  },
  USER_TOKENS: {
    id: 'usertokens',
    label: 'User Tokens',
    adminRequired: true
  }
};

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
function NCAdvancedPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [openTab, setOpenTab] = useState(TABS.IMPORT_EXPORT.id);
  const [password, setPassword] = useState('');
  const [hasAdminPermissions, setHasAdminPermissions] = useState(undefined);
  const [templateIsBeingEditedByMe, setTemplateIsBeingEditedByMe] = useState(false);

  useEffect(() => {
    UDATA.OnAppStateChange('PANELSTATE', evt_ToggleAdvanced);
    updateMyLockState();
    return () => {
      UDATA.AppStateChangeOff('PANELSTATE', evt_ToggleAdvanced);
    };
  }, []);

  useEffect(() => {
    updateMyLockState();
  }, [password, openTab]);

  /// UTILITY METHODS ///////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function isTemplate(tabID) {
    // Only UserTokens is not a template
    return [TABS.IMPORT_EXPORT.id, TABS.TEMPLATE.id, TABS.SETTINGS.id].includes(
      tabID
    );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  async function updateMyLockState() {
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    if (TEMPLATE && TEMPLATE.adminPassword === undefined)
      console.warn(
        'No admin password defined!  Please set it if you need admin access'
      );
    const isAdmin =
      TEMPLATE && TEMPLATE.adminPassword && TEMPLATE.adminPassword === password;

    // if I'm an admin, then consider locking
    if (isAdmin) {
      if (!RSB.IsTemplateLocked()) {
        // if the template is not locked, then consider locking it
        // if the openTab is a template
        if (isTemplate(openTab)) {
          // try to lock it
          if (await RSB.LockTemplate()) {
            // successful lock
            if (DBG) console.log(`%c ${PR}...... template locked`, 'color: red');
            setTemplateIsBeingEditedByMe(true);
          } else {
            if (DBG)
              console.log(
                `%c ${PR}...... lock failed, already locked`,
                'color: orange'
              );
          }
        }
      } else {
        // template is already locked, then consider unlocking it
        if (DBG)
          console.log(
            `%c ${PR}...... template is already locked, unlock?`,
            'color: gray'
          );

        // if I'm the one with the lock
        // and the openTab is NOT a template, then unlock it
        if (templateIsBeingEditedByMe && !isTemplate(openTab)) {
          if (DBG)
            console.log(`%c ${PR}...... releasing template lock`, 'color: green');
          RSB.ReleaseTemplate();
          setTemplateIsBeingEditedByMe(false);
        } else {
          if (DBG)
            console.log(`%c ${PR}...... template already locked`, 'color: gray');
        }
      }
    } else {
      // if I'm no longer an admin but have the lock, then unlock it
      if (templateIsBeingEditedByMe) {
        if (DBG)
          console.log(`%c ${PR}...... releasing template lock`, 'color: green');
        RSB.ReleaseTemplate();
        setTemplateIsBeingEditedByMe(false);
      } else {
        if (DBG)
          console.log(
            `%c ${PR}...... not admin, no lock, not doing anything`,
            'color: gray'
          );
      }
    }

    // update hasAdminPermissions state only if it's changed
    if (isAdmin !== hasAdminPermissions) setHasAdminPermissions(isAdmin);
    // update PERMISSIONS state only if it's changed
    const PERMISSIONS = UDATA.AppState('PERMISSIONS');
    if (isAdmin !== PERMISSIONS.isAdmin)
      UDATA.SetAppState('PERMISSIONS', { ...PERMISSIONS, isAdmin });
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_ToggleAdvanced(PANELSTATE) {
    setIsOpen(PANELSTATE.advancedIsOpen);
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
    setOpenTab(TABS.IMPORT_EXPORT.id); // Revert to default export tab
    setPassword('');
  }

  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const activeTabs = Object.values(TABS).filter(tab =>
    hasAdminPermissions ? tab.adminRequired : !tab.adminRequired
  );

  let jsx;
  switch (openTab) {
    case TABS.TEMPLATE.id:
      jsx = <NCTemplate templateIsBeingEditedByMe={templateIsBeingEditedByMe} />;
      break;
    case TABS.USER_TOKENS.id:
      jsx = <NCUserTokens />;
      break;
    case TABS.SETTINGS.id:
      jsx = (
        <MURSettingEditor templateIsBeingEditedByMe={templateIsBeingEditedByMe} />
      );
      break;
    case TABS.IMPORT_EXPORT.id:
    default:
      jsx = (
        <NCImportExport
          isAdmin={hasAdminPermissions}
          templateIsBeingEditedByMe={templateIsBeingEditedByMe}
        />
      );
      break;
  }

  if (!isOpen) return null;

  let adminStatusJsx;
  if (hasAdminPermissions === undefined) {
    // Admin Mode is disabled because the adminPassword has not been defined
    adminStatusJsx = <span>Admin Mode Disabled</span>;
    console.log(`NOTE: "adminPassword" is not set (premature mount?)`);
  } else if (hasAdminPermissions === false)
    // Admin Mode is disabled, show password
    adminStatusJsx = (
      <label>
        admin: <input type="password" id="password" onChange={ui_PasswordChange} />
      </label>
    );
  else if (hasAdminPermissions === true)
    // Admin Mode is enabled, show "Reset Password" button
    adminStatusJsx = (
      <button type="button" onClick={ui_PasswordClear}>
        Admin Logout
      </button>
    );

  return (
    <URPopover title="Advanced" onClose={ui_CloseAdvanced}>
      <div id="NCTabPanel" className="NCAdvancedPanel">
        <div className="tabs" role="tablist">
          {activeTabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              className={openTab === tab.id ? 'selected' : ''}
              aria-selected={openTab === tab.id}
              aria-controls={tab.id}
              tabIndex={openTab === tab.id ? '0' : '-1'}
              onClick={() => ui_SelectTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tabpanels">{jsx}</div>

        <div className="footer">{adminStatusJsx}</div>
      </div>
    </URPopover>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCAdvancedPanel;
