/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  NCFiltersSummary displays:
  * If no filters are active, the count of nodes and edges in the graph
  * If filters are active...
    - the summary of filters applied and
    - the count of nodes and edges active in the graph

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect, useRef } from 'react';
import UNISYS from 'unisys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCFiltersSummary' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// REACT FUNCTIONAL COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NCFiltersSummary() {
  const [state, setState] = useState({
    filtersSummary: '',
    graphStats: ''
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    UDATA.OnAppStateChange('FILTEREDNCDATA', urmsg_UpdateFilterSummary);
    return () => {
      UDATA.AppStateChangeOff('FILTEREDNCDATA', urmsg_UpdateFilterSummary);
    };
  }, []);

  function urmsg_UpdateFilterSummary(data) {
    // If there is no change in filtersSummary or graphStats, skip the state update
    // This prevents unnecessary re-renders and improves performance

    const { filtersSummary, graphStats } = data.stats;

    if (filtersSummary === state.filtersSummary && graphStats === state.graphStats) {
      console.warn(
        'FILTER_SUMMARY_UPDATE...urmsg_UpdateFilterSummary... no data skipping state update'
      );
      return;
    }

    if (
      (filtersSummary && filtersSummary !== state.filtersSummary) ||
      (graphStats && graphStats !== state.graphStats)
    ) {
      setState(prevState => ({
        ...prevState,
        filtersSummary: filtersSummary,
        graphStats: graphStats
      }));
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_ClearFilters() {
    UDATA.LocalCall('FILTER_CLEAR');
  }

  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <div id="filters-summary">
      {!state.filtersSummary && state.graphStats}
      {state.filtersSummary}
      {state.filtersSummary && (
        <button className="cat" onClick={evt_ClearFilters}>
          Clear Filters
        </button>
      )}
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
export default NCFiltersSummary;
