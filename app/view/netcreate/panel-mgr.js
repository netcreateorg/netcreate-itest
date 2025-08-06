/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  panel-mgr

  panel-mgr maintains the PANELSTATE app state, which is used to track the
  status of panel components, including:
  - NCVocabulary
  - NCHelp
  - NCAdvancedPanel
  - NCBugReport


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const UNISYS = require('unisys/client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'panel-mgr: ';

/// MODULE INITIALIZATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MOD = UNISYS.NewModule(module.id);
const UDATA = UNISYS.NewDataLink(MOD);

/// UTILITIES /////////////////////////////////////////////////////////////////

/// LIFECYCLE HANDLERS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook('INITIALIZE', () => {
  m_Init();
}); // end UNISYS_INIT

/// PRIVATE METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Init() {
  const PANELSTATE = {
    advancedIsOpen: false,
    helpIsOpen: false,
    vocabIsOpen: false,
    bugreportIsOpen: false
  };
  UDATA.SetAppState('PANELSTATE', PANELSTATE);
}

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AdvancedIsOpen() {
  return UDATA.AppState('PANELSTATE').advancedIsOpen;
}
function HelpIsOpen() {
  return UDATA.AppState('PANELSTATE').helpIsOpen;
}
function VocabIsOpen() {
  return UDATA.AppState('PANELSTATE').vocabIsOpen;
}
function BugreportIsOpen() {
  return UDATA.AppState('PANELSTATE').bugreportIsOpen;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ToggleAdvanced() {
  const PANELSTATE = UDATA.AppState('PANELSTATE');
  UDATA.SetAppState('PANELSTATE', {
    ...PANELSTATE,
    advancedIsOpen: !PANELSTATE.advancedIsOpen
  });
}
function ToggleHelp() {
  const PANELSTATE = UDATA.AppState('PANELSTATE');
  UDATA.SetAppState('PANELSTATE', {
    ...PANELSTATE,
    helpIsOpen: !PANELSTATE.helpIsOpen
  });
}
function ToggleVocabulary() {
  const PANELSTATE = UDATA.AppState('PANELSTATE');
  UDATA.SetAppState('PANELSTATE', {
    ...PANELSTATE,
    vocabIsOpen: !PANELSTATE.vocabIsOpen
  });
}
function ToggleBugreport() {
  const PANELSTATE = UDATA.AppState('PANELSTATE');
  UDATA.SetAppState('PANELSTATE', {
    ...PANELSTATE,
    bugreportIsOpen: !PANELSTATE.bugreportIsOpen
  });
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  AdvancedIsOpen,
  HelpIsOpen,
  VocabIsOpen,
  BugreportIsOpen,
  ToggleAdvanced,
  ToggleHelp,
  ToggleVocabulary,
  ToggleBugreport
};
