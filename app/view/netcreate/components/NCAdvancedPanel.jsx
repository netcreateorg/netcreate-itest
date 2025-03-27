/* eslint-disable react/no-unescaped-entities */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    Vocabulary displays a list of common terms

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import ImportExport from './ImportExport';
import NCTemplate from './NCTemplate';
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
  importexport: 'Import/Export',
  template: 'Template',
  settings: 'Settings'
};

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
function NCAdvancedPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [openTab, setOpenTab] = useState('importexport');

  useEffect(() => {
    UDATA.OnAppStateChange('PANELSTATE', evt_ToggleAdvanced);
    return () => {
      UDATA.AppStateChangeOff('PANELSTATE', evt_ToggleAdvanced);
    };
  }, []);

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
    console.log('setting tab to', tab);
    setOpenTab(tab);
  }

  // COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  let jsx;
  switch (openTab) {
    case 'importexport':
      jsx = <ImportExport />;
      break;
    case 'template':
      jsx = <NCTemplate />;
      break;
    case 'settings':
      jsx = <MURSettingEditor />;
      break;
    default:
      break;
  }

  if (!isOpen) return null;
  return (
    <URPopover title="Advanced" onClose={ui_CloseAdvanced}>
      <div id="NCTabPanel">
        <div className="tabs" role="tablist">
          {Object.keys(VIEWS).map(k => (
            <button
              key={k}
              role="tab"
              className={openTab === k ? 'selected' : ''}
              aria-selected={openTab === k}
              aria-controls={k}
              tabIndex={openTab === k ? '0' : '-1'}
              onClick={() => ui_SelectTab(k)}
            >
              {VIEWS[k]}
            </button>
          ))}
        </div>

        <div className="tabpanels">{jsx}</div>
      </div>
    </URPopover>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCAdvancedPanel;
