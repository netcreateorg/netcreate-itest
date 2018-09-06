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
const UNISYS       = require('unisys/client');

/// DEBUG SWITCHES ////////////////////////////////////////////////////////////
var   DBG          = false;
const PROMPTS      = require('system/util/prompts');
const PR           = PROMPTS.Pad('ACD');

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React        = require('react');
const NetGraph     = require('./components/NetGraph');
const Search       = require('./components/Search');
const NodeSelector = require('./components/NodeSelector');
const Help         = require('./components/Help');
const NodeTable    = require('./components/NodeTable');
const EdgeTable    = require('./components/EdgeTable');
const ACD_LOGIC    = require('./nc-logic');


/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
/*/ class NetCreate extends UNISYS.Component {
      constructor () {
        super();
        UNISYS.ForceReloadOnNavigation();
        this.OnDOMReady(()=>{
          if (DBG) console.log(PR,'OnDOMReady');
        });
        this.OnReset(()=>{
          if (DBG) console.log(PR,'OnReset');
        });
        this.OnStart(()=>{
          if (DBG) console.log(PR,'OnStart');
        });
        this.OnAppReady(()=>{
          if (DBG) console.log(PR,'OnAppReady');
        });
        this.OnRun(()=>{
          if (DBG) console.log(PR,'OnRun');
        });
      }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ This is the root component, so this fires after all subcomponents have
      been fully rendered by render().
  /*/ componentDidMount () {
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Define the component structure of the web application
  /*/ render() {
        return (
          <div>
            <div style={{display:'flex', flexFlow:'row nowrap',
                width:'100%', height:'100vh',overflow:'hidden'}}>
              <div id="left" style={{backgroundColor:'#EEE',flex:'1 1 25%',maxWidth:'400px',padding:'10px',overflow:'scroll',marginTop:'56px'}}>
                <div style={{display:'flex',flexFlow:'column nowrap'}}>
                  <Search/>
                  <NodeSelector/>
                </div>
              </div>
              <div id="middle" style={{backgroundColor:'#fcfcfc', flex:'3 0 60%', padding:'10px',marginTop:'56px'}}>
                <Help/>
                <NodeTable/>
                <EdgeTable/>
                <NetGraph/>
                <div style={{fontSize:'10px',position:'absolute',left:'0px',bottom:'0px',zIndex:'1500',color:'#aaa',backgroundColor:'#eee',padding:'5px 10px'}}>Please contact Professor
                Kalani Craig, Institute for Digital Arts & Humanities at
                (812) 856-5721 (BH) or
                craigkl@indiana.edu with questions or concerns and/or to
                request information contained on this website in an accessible
                format.</div>
              </div>
            </div>
          </div>
        ); // end return
      } // end render()
    } // end class NetCreate

/// EXPORT UNISYS SIGNATURE ///////////////////////////////////////////////////
/// used in init.jsx to set module scope early
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NetCreate.UMOD = module.id;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NetCreate
