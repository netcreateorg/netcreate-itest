/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  table-column-state

  table-column-state manages the column visibility for the
  NCNodeTable and NCEdgeTable components, setting TBLCOLSTATE.

  It is used by:
  - NCNodeTable
  - NCEdgeTable

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const UNISYS = require('unisys/client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'table-column-state: ';

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
  const TBLCOLSTATE = {
    nodeColumnPanelIsOpen: false,
    nodeDisplayedColumnIDs: [], // array of visible column IDs
    edgeColumnPanelIsOpen: false,
    edgeDisplayedColumnIDs: [] // array of visible column IDs
  };
  UDATA.SetAppState('TBLCOLSTATE', TBLCOLSTATE);
}); // end UNISYS_INIT

/// PRIVATE METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {};
