/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    NetCreate

    The basic React Component structure of the app looks like this:

        NetCreate
        +- NodeSelector
        |  +- NodeDetail
        |  +- AutoComplete
        |  |  +- AutoSuggest
        |  +- EdgeEntry
        |     +- *AutoComplete (for Target Node)*
        +- NetGraph
           +- D3SimpleNetGraph
              +- D3

    `NetCreate` is the root element. It is a wrapper for the key app
    elements `NodeSelector` and `NetGraph`.

    It does not do any data or event handling.  Those are handled individually
    by the respective Components.

  * All state is maintained in `nc-logic.js`
  * It handles events from NodeSelector, EdgeEntry, and NetGraph components
      and passes data and upates across them.

    PROPS  ... (none)
    STATE  ... (none)
    EVENTS ... (none)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// UNISYS INITIALIZE REQUIRES for REACT ROOT /////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS = require('unisys/client');
const UR = require('ursys-min');
const SessionShell = require('unisys/component/SessionShell');

/// SWITCHES //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var DBG = false;
const PROMPTS = require('system/util/prompts');
const PR = PROMPTS.Pad('ACD');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const NCSearch = require('./components/NCSearch');
const NCNode = require('./components/NCNode');
const NCGraph = require('./components/NCGraph');
const NCLOGIC = require('./nc-logic'); // require to bootstrap data loading
const FILTERMGR = require('./filter-mgr'); // handles filtering functions
const EDGEMGR = require('./edge-mgr'); // handles edge synthesis
const SELECTIONMGR = require('./selection-mgr'); // handles UI selection events
const HILITEMGR = require('./hilite-mgr'); // handles UI hilite events
const CMTMGR = require('./comment-mgr');
const FILTER = require('./components/filter/FilterEnums');
import PANELMGR from './panel-mgr';
import TBLCOLSTATE from './table-column-state'; // inits TBLCOLSTATE for app, but not used in this component
import NCInfoPanel from './components/NCInfoPanel';
import NCHelpPanel from './components/NCHelpPanel';
import NCAdvancedPanel from './components/NCAdvancedPanel';
import NCBugReport from './components/NCBugReport';
import NCFiltersPanel from './components/filter/NCFiltersPanel';
import URButtonToggle from './components/URButtonToggle';
import URCommentStatus from './components/URCommentStatus';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class NetCreate extends UNISYS.Component {
  constructor() {
    super();
    UNISYS.IsReloadRequired();

    // URSYS TEST CODE - not used by NetCreate
    const SM = new UR.StateMgr('NETCREATE');
    SM._initializeState({ prop_1: 1 });
    // console.log('NetCreate: UR:', UR);
    // console.log('SM:StateMgr contains:', SM.state());

    // URSYS COMPONENT INIT - used by comment-mgr.js
    UR.COMMENT.Init();

    this.state = {
      isConnected: true,
      isLoggedIn: false,
      requireLogin: this.AppState('TEMPLATE').requireLogin,
      disconnectMsg: '',
      layoutNodesOpen: true,
      layoutFiltersOpen: false,
      commentStatusMessage: 'waiting...'
    };
    this.OnDOMReady(() => {
      if (DBG) console.log(PR, 'OnDOMReady');
    });
    this.OnReset(() => {
      if (DBG) console.log(PR, 'OnReset');
    });
    this.OnStart(() => {
      if (DBG) console.log(PR, 'OnStart');
    });
    this.OnAppReady(() => {
      if (DBG) console.log(PR, 'OnAppReady');
    });
    this.OnRun(() => {
      if (DBG) console.log(PR, 'OnRun');
    });
    this.OnDisconnect(e => {
      if (DBG) console.log(PR, 'OnDisconnect');
      // This is now handled by the UDATA "DISCONNECT" message.
      // so that we can show a message explaining the cause of disconnect.
      // this.setState({ isConnected: false });
    });

    this.onStateChange_SESSION = this.onStateChange_SESSION.bind(this);
    this.onStateChange_PANELSTATE = this.onStateChange_PANELSTATE.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);
    this.onFilterBtnClick = this.onFilterBtnClick.bind(this);

    this.OnAppStateChange('SESSION', this.onStateChange_SESSION);
    this.OnAppStateChange('PANELSTATE', this.onStateChange_PANELSTATE);

    this.HandleMessage('DISCONNECT', this.onDisconnect);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** SESSION is called by SessionShell when the ID changes
      Show or hide netgraph depending on template settings.
   */
  onStateChange_SESSION(decoded) {
    this.setState({ isLoggedIn: decoded.isValid });
  }

  onStateChange_PANELSTATE(data) {
    this.setState({ render: true }); // REVIEW: force render?
  }

  onDisconnect(e) {
    const time = new Date().toLocaleTimeString();
    this.setState({
      isConnected: false,
      disconnectMsg: `${e.detail.message} ${time}`
    });
  }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** This is the root component, so this fires after all subcomponents have
      been fully rendered by render().
   */
  componentDidMount() {
    // Init dragger
    let dragger = document.getElementById('dragger');
    dragger.onmousedown = this.handleMouseDown;
  }

  componentWillUnmount() {
    this.AppStateChangeOff('SESSION', this.onStateChange_SESSION);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  onFilterBtnClick(e) {
    this.setState(state => {
      return { layoutFiltersOpen: !state.layoutFiltersOpen };
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Define the component structure of the web application
   */
  render() {
    const {
      isLoggedIn,
      disconnectMsg,
      layoutNodesOpen,
      layoutFiltersOpen,
      commentStatusMessage,
      handleMessageUpdate
    } = this.state;

    // show or hide graph
    // Use 'visibiliity' css NOT React's 'hidden' so size is properly
    // calculated on init
    let hideGraph = 'visible';
    if (this.state.requireLogin && !isLoggedIn) hideGraph = 'hidden';

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const DISCONNECTED_MSG = this.state.isConnected ? (
      ''
    ) : (
      <div className="--NetCreate_Fixed_Top_SaveAlert nc-savealert">
        <div>
          <b>{disconnectMsg}!</b> Your changes will not be saved! Please report &quot;
          {disconnectMsg}&quot; to your administrator to restart the graph.
        </div>
      </div>
    );
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const NAVBAR = (
      <nav className="--NetCreate_Fixed_Top nc-navbar" role="navigation">
        <div style={{ width: '3rem' }}></div>
        <SessionShell />
        <div style={{ flexGrow: 1 }}></div>
        <URCommentStatus
          message={commentStatusMessage}
          handleMessageUpdate={handleMessageUpdate}
        />
        <div style={{ flexGrow: 1 }}></div>
        <img src="images/netcreate-logo.svg" height="25px" alt="NetCreate Logo" />
      </nav>
    );
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// Force Help and Advanced to render AFTER main page
    /// so that focus tab order comes AFTER the main content.
    const NAVBTNS = (
      <div className="nc-navbar-btns">
        <URButtonToggle
          title="Show/Hide Help"
          selected={PANELMGR.HelpIsOpen()}
          onClick={PANELMGR.ToggleHelp}
        >
          <img src="images/icn_help.svg" alt="Help" />
        </URButtonToggle>
        <URButtonToggle
          title="Show/Hide Advanced"
          selected={PANELMGR.AdvancedIsOpen()}
          onClick={PANELMGR.ToggleAdvanced}
        >
          <img src="images/icn_advanced.svg" alt="Advanced" />
        </URButtonToggle>
      </div>
    );
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    const BUGREPORTBTN = (
      <div className="nc-bugreport-btn">
        <URButtonToggle
          title="Show/Hide Bug Report"
          selected={PANELMGR.BugreportIsOpen()}
          onClick={PANELMGR.ToggleBugreport}
        >
          ⚠︎
        </URButtonToggle>
      </div>
    );
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    return (
      <main className="--NetCreate nc-base" role="main">
        {DISCONNECTED_MSG}
        {NAVBAR}

        <div className="--NetCreate_Rows nc-rows" style={{ visibility: hideGraph }}>
          {/*** LEFT EDITOR COLUMN ***************/}
          <div className="--NetCreate_Columns nc-col-left" id="left">
            <NCSearch />
            <NCNode />
            {BUGREPORTBTN}
          </div>
          {/*** CENTER NETVIEW COLUMN***************/}
          <div className="--NetCreate_Column_NetView nc-col-middle">
            <NCInfoPanel />
            <NCGraph />
          </div>
          {/*** RIGHT VIEW COLUMN ***************/}
          <div className="--NetCreate_Column_Filters_Open nc-col-right" id="right">
            <div
              id="filterpanel"
              className={layoutFiltersOpen ? 'filterpanelOpen' : ''}
            >
              <button
                className="cat"
                id="filterpanel-btn"
                type="button"
                aria-label={
                  layoutFiltersOpen
                    ? `Close ${FILTER.PANEL_LABEL}`
                    : `Open ${FILTER.PANEL_LABEL}`
                }
                onClick={this.onFilterBtnClick}
              >
                {FILTER.PANEL_LABEL}
              </button>
              <NCFiltersPanel hidden={!layoutFiltersOpen} />
            </div>
          </div>

          {NAVBTNS}
        </div>
        {/*** DIALOGS ***************/}
        <div id="dialog-container"></div>
        <NCHelpPanel />
        <NCAdvancedPanel />
        <NCBugReport hidden={this.state.isConnected} />
      </main>
    ); // end return
  } // end render()
} // end class NetCreate

/// EXPORT UNISYS SIGNATURE ///////////////////////////////////////////////////
/// used in init.jsx to set module scope early
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NetCreate.UMOD = module.id;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetCreate;
