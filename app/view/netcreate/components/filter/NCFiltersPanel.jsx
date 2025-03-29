/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FILTERSPANEL

  This is the base UI component that displays filters in the InfoPanel.

  FiltersPanel
  |-- FiltersGroup
      |-- StringFilter
      |-- NumberFilter
      |-- SelectFilter

  FiltersPanel reads data directly from FILTERDEFS.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import FILTER from './FilterEnums';
import FilterGroup from './NCFilterGroup';
import FocusFilter from './NCFocusFilter';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCFiltersPanel' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCFiltersPanel: ';

/// CLASS DECLARATIONS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NCFiltersPanel({ hidden }) {
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Load Templates
  const TEMPLATE = UDATA.AppState('TEMPLATE');
  const TABS = {
    FADE: { action: FILTER.ACTION.FADE, label: TEMPLATE.filterFade },
    REDUCE: { action: FILTER.ACTION.REDUCE, label: TEMPLATE.filterReduce },
    FOCUS: { action: FILTER.ACTION.FOCUS, label: TEMPLATE.filterFocus }
  };
  // The intial `OnAppStateChange("FILTERDEFS")` event when the template is
  // first loaded is called well before FiltersPanel is
  // even constructed.  So we need to explicitly load it here.
  const FILTERDEFS = UDATA.AppState('FILTERDEFS');
  const [state, setState] = useState({
    nodes: FILTERDEFS.nodes,
    edges: FILTERDEFS.edges,
    filterAction: FILTER.ACTION.FADE,
    filterActionHelp: '',
    focusSourceLabel: undefined,
    focusRange: undefined,
    statsSummary: ''
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    // update filter stats on load
    const FILTEREDNCDATA = UDATA.AppState('FILTEREDNCDATA');
    urstate_UpdateFilteredNCData(FILTEREDNCDATA);

    UDATA.OnAppStateChange('FILTERDEFS', urstate_UpdateFilterDefs);
    UDATA.OnAppStateChange('FILTEREDNCDATA', urstate_UpdateFilteredNCData);
    return () => {
      UDATA.AppStateChangeOff('FILTERDEFS', urstate_UpdateFilterDefs);
      UDATA.AppStateChangeOff('FILTEREDNCDATA', urstate_UpdateFilteredNCData);
    };
  }, []);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function urstate_UpdateFilterDefs(data) {
    if (DBG) console.log(PR, 'FILTERDEFS', data);
    setState(prevState => ({
      ...prevState,
      nodes: data.nodes,
      edges: data.edges,
      filterAction: data.filterAction || prevState.filterAction,
      filterActionHelp: data.filterActionHelp || prevState.filterActionHelp,
      focusSourceLabel:
        data.focus && data.focus.sourceLabel ? data.focus.sourceLabel : '',
      focusRange: data.focus && data.focus.range ? data.focus.range : undefined
    }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function urstate_UpdateFilteredNCData(data = { stats: {} }) {
    setState(prevState => ({ ...prevState, statsSummary: data.stats.statsSummary }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_LookupFilterHelp(filterAction) {
    if (filterAction === FILTER.ACTION.FADE) return TEMPLATE.filterFadeHelp;
    if (filterAction === FILTER.ACTION.REDUCE) return TEMPLATE.filterReduceHelp;
    if (filterAction === FILTER.ACTION.FOCUS) return TEMPLATE.filterFocusHelp;
    return 'Help not found';
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnClearBtnClick() {
    UDATA.LocalCall('FILTER_CLEAR');
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_SelectFilterAction(filterAction) {
    setState(prevState => ({ ...prevState, filterAction }));
    UDATA.LocalCall('FILTERS_UPDATE', { filterAction });
  }

  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const { filterAction, focusRange, focusSourceLabel, statsSummary, nodes, edges } =
    state;
  const defs = [nodes, edges];
  const filterActionHelp = evt_LookupFilterHelp(filterAction);

  let FilterControlPanel;
  if (filterAction === FILTER.ACTION.FOCUS) {
    FilterControlPanel = (
      <FocusFilter focusSourceLabel={focusSourceLabel} focusRange={focusRange} />
    );
  } else {
    FilterControlPanel = defs.map(def => (
      <FilterGroup
        key={def.label}
        group={def.group}
        label={def.label}
        filters={def.filters}
        filterAction={filterAction}
        transparency={def.transparency}
      />
    ));
  }

  return (
    <div className="NCFiltersPanel" hidden={hidden}>
      <div className="tabselectors" role="tablist">
        {Object.keys(TABS).map(k => (
          <button
            key={k}
            className={filterAction === TABS[k].action ? 'selected' : ''}
            onClick={() => ui_SelectFilterAction(TABS[k].action)}
            role="tab"
            type="button"
            aria-selected={filterAction === TABS[k].action}
            aria-controls={TABS[k].label}
          >
            {TABS[k].label}
          </button>
        ))}
      </div>

      <div className="tabpanels">
        <label className="help">{filterActionHelp}</label>

        {FilterControlPanel}

        <div className="controlbar">
          <button className="small" type="button" onClick={ui_OnClearBtnClick}>
            Clear Filters
          </button>
        </div>
      </div>

      <label className="help">{statsSummary}</label>
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
export default NCFiltersPanel;
