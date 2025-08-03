/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  # URTableColumnMgr

  URTableColumnMgr is a React component that provides a user interface for managing
  the visibility of columns in a table.

  It works with Node/Edge specific table components:
  - NCNodeTable
  - NCEdgeTable



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React from 'react';
import UNISYS from 'unisys/client';
import URPopover from './URPopover';
import { TABLETYPE } from '../../../system/util/enum';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for reuact component
const UDATAOwner = { name: 'URTableColumnPanel' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function URTableColumnPanel({ tableType, columnDefs, visibleColumnIDs }) {
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_CloseTableColMgr() {
    const TBLCOLSTATE = UDATA.AppState('TBLCOLSTATE');
    if (tableType === TABLETYPE.NODE) TBLCOLSTATE.nodeColumnPanelIsOpen = false;
    if (tableType === TABLETYPE.EDGE) TBLCOLSTATE.edgeColumnPanelIsOpen = false;
    UDATA.SetAppState('TBLCOLSTATE', TBLCOLSTATE);
  }

  /// UI HANDLERS ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Column visibility is saved in TBLCOLSTATE
  /// NCNodeTable and NCEdgeTable track TBLCOLSTATE changes
  function ui_ToggleColumnVisibility(event) {
    const columnId = event.target.getAttribute('data-column-id');
    const newVisibleColumnIDs = visibleColumnIDs.includes(columnId)
      ? visibleColumnIDs.filter(col => col !== columnId)
      : [...visibleColumnIDs, columnId];
    const TBLCOLSTATE = UDATA.AppState('TBLCOLSTATE');
    if (tableType === TABLETYPE.NODE)
      TBLCOLSTATE.nodeDisplayedColumnIDs = newVisibleColumnIDs;
    if (tableType === TABLETYPE.EDGE)
      TBLCOLSTATE.edgeDisplayedColumnIDs = newVisibleColumnIDs;

    UDATA.SetAppState('TBLCOLSTATE', TBLCOLSTATE);
  }

  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const TBLCOLSTATE = UDATA.AppState('TBLCOLSTATE');
  if (tableType === TABLETYPE.NODE && !TBLCOLSTATE.nodeColumnPanelIsOpen) return null;
  if (tableType === TABLETYPE.EDGE && !TBLCOLSTATE.edgeColumnPanelIsOpen) return null;

  // Skip blank columns (e.g. View/Edit buttons)
  const filteredColumnDefs = columnDefs.filter(
    col => col.title !== undefined && col.title.trim() !== ''
  );

  return (
    <URPopover
      title={`Show/Hide Columns`}
      onClose={ui_CloseTableColMgr}
      className="URTableColumnPanel"
    >
      <div>
        {filteredColumnDefs.map((colDef, index) => (
          <div key={index} className="key-value-pair">
            <input
              type="checkbox"
              data-column-id={colDef.data}
              checked={visibleColumnIDs.includes(colDef.data)}
              onChange={ui_ToggleColumnVisibility}
            />
            <label>{colDef.title}</label>
          </div>
        ))}
      </div>
    </URPopover>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default URTableColumnPanel;
