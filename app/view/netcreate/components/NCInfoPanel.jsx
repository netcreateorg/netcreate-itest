/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  InfoPanel shows a tab panel for selecting:
  * hiding (showing the Graph)
  * Filters
  * Nodes Table
  * Edges Table
  * More -- Export/Import, Vocabulary, Help

  The panel itself can be resized vertically.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect, useRef } from 'react';
import UNISYS from 'unisys/client';
import NCFiltersSummary from './NCFiltersSummary';
import NCNodeTable from './NCNodeTable';
import NCEdgeTable from './NCEdgeTable';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCInfoPanel' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TABS = {
  GRAPH: { label: 'Graph', icon: 'images/icn_graph.svg' },
  NODESTABLE: { label: 'Nodes Table', icon: 'images/icn_attributes.svg' },
  EDGESTABLE: { label: 'Edges Table', icon: 'images/icn_edges.svg' }
};
const defaultClosedTabPanelHeight = 65; // show only tab buttons, no gap, max 2 lines
const defaultOpenTabPanelHeight = 350; // show tab buttons and table

/// REACT FUNCTIONAL COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NCInfoPanel() {
  const [state, setState] = useState({
    activeTab: TABS.GRAPH.label,
    infoPanelTop: 0,
    tabpanelHeight: defaultClosedTabPanelHeight,
    prevNodeTableHeight: 0,
    prevEdgeTableHeight: 0,
    draggerIsHidden: true
  });
  const ref_InfoPanel = useRef(null);
  const ref_Dragger = useRef(null);
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    if (ref_InfoPanel.current) {
      setState(prevState => ({
        ...prevState,
        infoPanelTop: ref_InfoPanel.current.offsetTop
      }));
    }
  }, []);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_SelectTab(tabkey) {
    let tabpanelHeight = defaultClosedTabPanelHeight;
    let draggerIsHidden = true;

    if (tabkey === 'NODESTABLE') {
      tabpanelHeight = state.prevNodeTableHeight || defaultOpenTabPanelHeight;
      draggerIsHidden = false;
    } else if (tabkey === 'EDGESTABLE') {
      tabpanelHeight = state.prevEdgeTableHeight || defaultOpenTabPanelHeight;
      draggerIsHidden = false;
    }

    UpdateMaxTableHeight(TABS[tabkey].label);

    setState(prevState => ({
      ...prevState,
      activeTab: TABS[tabkey].label,
      tabpanelHeight,
      draggerIsHidden
    }));
  }

  /// DRAGGER HANDLERS ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Update max table height whenever the active tab changes
  function UpdateMaxTableHeight(activeTab) {
    const maxTableHeight =
      state.infoPanelTop +
      80 +
      (activeTab === TABS.NODESTABLE.label
        ? document.querySelector('#NCNodeTable .URTable').offsetHeight
        : document.querySelector('#NCEdgeTable .URTable').offsetHeight);
    ref_Dragger.current = {
      ...ref_Dragger.current,
      maxTableHeight
    };
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_MouseDown(event) {
    event.preventDefault();
    event.stopPropagation();
    const draggerClickOffset = event.target.offsetTop - event.clientY;
    const maxTableHeight =
      state.infoPanelTop +
      draggerClickOffset +
      80 +
      (state.activeTab === TABS.NODESTABLE.label
        ? document.querySelector('#NCNodeTable .URTable').offsetHeight
        : document.querySelector('#NCEdgeTable .URTable').offsetHeight);

    ref_Dragger.current = {
      startY: event.clientY,
      draggerTop: event.target.offsetTop,
      draggerClickOffset,
      maxTableHeight
    };
    document.onmousemove = ui_MouseMove;
    document.onmouseup = ui_MouseUp;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_MouseMove(event) {
    event.preventDefault();
    event.stopPropagation();
    if (ref_Dragger.current !== null) {
      const { startY, draggerTop, draggerClickOffset, maxTableHeight } =
        ref_Dragger.current;
      const tabpanelHeight = Math.min(
        maxTableHeight,
        Math.max(
          120, // make sure one row is visible
          event.clientY - state.infoPanelTop - draggerClickOffset
        )
      );
      let { prevNodeTableHeight, prevEdgeTableHeight } = state;
      if (state.activeTab === TABS.NODESTABLE.label) {
        prevNodeTableHeight = tabpanelHeight;
      } else if (state.activeTab === TABS.EDGESTABLE.label) {
        prevEdgeTableHeight = tabpanelHeight;
      }
      setState(prevState => ({
        ...prevState,
        tabpanelHeight,
        prevNodeTableHeight,
        prevEdgeTableHeight
      }));
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_MouseUp() {
    ref_Dragger.current = null;
    document.onmouseup = null;
    document.onmousemove = null;
  }

  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// NOTE: The `id=graph` tabpanel needs to be defined for wcag compliance
  ///       but it is hidden and not used.
  return (
    <div
      id="InfoPanel"
      ref={ref_InfoPanel}
      style={
        state.activeTab === TABS.GRAPH.label
          ? {}
          : { height: `${state.tabpanelHeight}px` }
      }
    >
      <div className="graphtitle">
        <div className="tooltipAnchor">
          NETGRAPH for {UDATA.AppState('TEMPLATE').name}&nbsp;
          <div className="badge">i</div>
          <span style={{ fontSize: '12px' }} className="tooltiptext">
            {UDATA.AppState('TEMPLATE').description}
          </span>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {Object.keys(TABS).map(k => (
          <button
            key={k}
            id={k}
            className={state.activeTab === TABS[k].label ? 'selected' : ''}
            onClick={() => evt_SelectTab(k)}
            role="tab"
            type="button"
            aria-selected={state.activeTab === TABS[k].label}
            aria-controls={TABS[k].label}
          >
            {TABS[k].label}
            {TABS[k].icon && <img src={TABS[k].icon} role="presentation" />}
          </button>
        ))}
      </div>

      <NCFiltersSummary />

      <div className="tabpanels">
        <section id={TABS.GRAPH.label} className="hidden" role="tabpanel" />

        <section
          id={TABS.NODESTABLE.label}
          aria-labelledby="NODESTABLE"
          role="tabpanel"
          className={state.activeTab !== TABS.NODESTABLE.label ? 'hidden' : ''}
        >
          <NCNodeTable isOpen={state.activeTab === TABS.NODESTABLE.label} />
        </section>

        <section
          id={TABS.EDGESTABLE.label}
          aria-labelledby="EDGESTABLE"
          role="tabpanel"
          className={state.activeTab !== TABS.EDGESTABLE.label ? 'hidden' : ''}
        >
          <NCEdgeTable isOpen={state.activeTab === TABS.EDGESTABLE.label} />
        </section>
      </div>

      <div className="bottombar">
        <div
          id="dragger"
          hidden={state.draggerIsHidden}
          onMouseDown={ui_MouseDown}
        ></div>
      </div>
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
export default NCInfoPanel;
