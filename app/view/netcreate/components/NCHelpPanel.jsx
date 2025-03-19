/* eslint-disable react/no-unescaped-entities */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

    Vocabulary displays a list of common terms

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import NCHelpVocabulary from './NCHelpVocabulary';
import NCHelpText from './NCHelpText';
import URPopover from './URPopover';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCHelpPanel' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const VIEWS = {
  help: 'Help',
  vocabulary: 'Vocabulary'
};

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
function NCHelpPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [openTab, setOpenTab] = useState('help');

  useEffect(() => {
    UDATA.OnAppStateChange('PANELSTATE', evt_ToggleHelp);
    return () => {
      UDATA.AppStateChangeOff('PANELSTATE', evt_ToggleHelp);
    };
  }, []);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_ToggleHelp(PANELSTATE) {
    setIsOpen(PANELSTATE.helpIsOpen);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_CloseHelp() {
    const PANELSTATE = UDATA.AppState('PANELSTATE');
    UDATA.SetAppState('PANELSTATE', { ...PANELSTATE, helpIsOpen: false });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_SelectTab(tab) {
    console.log('setting tab to', tab);
    setOpenTab(tab);
  }

  // COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  let jsx;
  if (openTab === 'help') {
    jsx = <NCHelpText />;
  } else {
    jsx = <NCHelpVocabulary />;
  }

  if (!isOpen) return null;
  return (
    <URPopover title="?" onClose={ui_CloseHelp}>
      <div id="NCHelpPanel">
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
export default NCHelpPanel;
