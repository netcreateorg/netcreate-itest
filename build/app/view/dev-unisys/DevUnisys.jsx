if (window.NC_DBG.inc) console.log(`inc ${module.id}`);
/// SYSTEM INTEGRATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNISYS      = require('unisys/client');
const REFLECT     = require('system/util/reflection');
/// MAGIC: DevUnisysLogic will add UNISYS Lifecycle Hooks on require()
const LOGIC       = require('./DevUnisysLogic');
const {Switch, Route, Redirect, Link} = require('react-router-dom');


const TEST        = require('test');
var   DBG         = false;

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React       = require('react');
const ReactStrap  = require('reactstrap');
const { InputGroup, InputGroupAddon, InputGroupText, Input } = ReactStrap;
const { Alert }   = ReactStrap;
const PROMPTS     = require('system/util/prompts');
const PR          = PROMPTS.Pad('DevUnisys');

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ This is the root component for the view
/*/ class DevUnisys extends React.Component {
      constructor(props) {
        super(props);

        /* UNISYS DATA LINK CONNECTION */
        this.udata = UNISYS.NewDataLink(this);

        /* INITIALIZE COMPONENT STATE from UNISYS */
        // get any state from 'VIEW' namespace; empty object if nothing
        // UDATA.State() returns a copy of state obj; mutate/assign freely
        let state = this.udata.State('VIEW');
        // initialize some state variables
        state.description = state.description || 'uninitialized description';
        // REACT TIP: setting state directly works ONLY in React.Component constructor!
        this.state = state;

        /* LOCAL INTERFACE HANDLERS */
        this.handleTextChange  = this.handleTextChange.bind(this);

        /* UNISYS STATE CHANGE HANDLERS */
        // bind 'this' context to handler function
        // then use for handling UNISYS state changes
        this.UnisysStateChange = this.UnisysStateChange.bind(this);
        // NOW set up handlers...
        this.udata.OnStateChange('VIEW', this.UnisysStateChange);
        this.udata.OnStateChange('LOGIC', this.UnisysStateChange);

        /* UNISYS LIFECYCLE INITIALIZATION */
        // initialize UNISYS before declaring any hook functions
        UNISYS.SystemInitialize(module.id);
        // hook start handler to initiate call

        /* CONFIGURE UNISYS TESTS */
        // enable debug output and tests
        // true = enabled, false = skip
        TEST('state'  , true);  // state events and changes
        TEST('hook'   , true);  // lifecycle hooks
        TEST('call'   , true);  // internal instance calls
        TEST('remote' , true);  // instance-to-instance calls
        TEST('server' , true);  // server calls
        TEST('net'    , true);  // network initialization

        /* UNISYS TESTS */
        // these run during a hook, but are defined in constructor
        UNISYS.Hook('INITIALIZE',() => {
          /* UNISYS TEST MESSAGE HANDLER REGISTRATION */
          if (TEST('remote')) {
            this.udata.HandleMessage('REMOTE_CALL_TEST',(data, msgcon) => {
              // msgcon is message control
              data.cat = 'calico';
              data.melon += '_ack';
              return data;
            });
          }
          if (TEST('call')) {
            this.udata.HandleMessage('TEST_CALL',(data)=>{
              if (!data.stack) data.stack=[]; data.stack.push('TRI-JSX');
              return data;
            });
          }
        });
        UNISYS.Hook('START',() => {
          /* UNISYS TEST MESSAGE HANDLER INVOCATION */
          if (TEST('call')) {
            // INVOKE remove call
            this.udata.LocalCall('TEST_CALL',{ source : 'DevUnisysJSX' })
            // test data return
            .then((data)=>{
              if (data && data.source && data.source==='DevUnisysLogic-Return') TEST.Pass('callDataReturn');
              if (data && data.extra && data.extra==='AddedData') TEST.Pass('callDataAdd');
              if (data && data.multi && data.stack && data.stack.length===3 && data.multi==='MultiData') TEST.Pass('callDataMulti');
            });
          }
        }); // START hook

      } // constructor

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UNISYS state change handler - registered by UNISYS.OnStateChange()
  /// state is coming from UNISYS
      UnisysStateChange( state ) {
        if (DBG) console.log(`.. REACT <- state`,state,`via ${this.udata.UID()}'`);
        // update local react state, which should force an update
        this.setState(state);
      }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// COMPONENT state change handler - registered in render()
  /// state is coming FROM component, which is updating already
      handleTextChange( event ) {
        let target = event.target;
        let state = {
          description : target.value
        }
        if (DBG) console.log(`REACT -> state`,state,`to ${this.udata.UID()}`);
        this.udata.SetState('VIEW',state,this.uni_id);
      }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// COMPONENT this interface has composed
      componentDidMount() {
        // start the application phase
        let className = REFLECT.ExtractClassName(this);
        if (DBG) console.log(`${className} componentDidMount`);
        // initialize network
        UNISYS.NetworkInitialize(() => {
          console.log(PR,'unisys network initialized');
          // kickoff initialization stage by stage
          (async () => {
            await UNISYS.EnterApp();
            await UNISYS.SetupRun();
          })();
        });
      } // componentDidMount

    StudentRender ({ match }) {
      console.log('-- STUDENT RENDER --');
      return (
        <p style={{color:'red'}}><small>matching subroute: {match.params.unit} {match.params.user}!</small></p>
      );
    }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /*/ Try to route the following
      http://localhost:3000/#dev-unisys/use/student/UNIT_KEY/USER_KEY/
  /*/ render() {
        return (
            <div id='fdshell' style={{padding:'10px'}}>
              <h2>Unisys Feature Development Shell</h2>
              <Route path={`${this.props.match.path}/student/:unit/:user`} component={this.StudentRender}/>
              <h4>UISTATE TESTS</h4>
              <p>{this.state.description}</p>
              <Input type="text" name="desc" id="desc" placeholder="text to change" onChange={this.handleTextChange} />
              <p>random string from LOGIC: {this.state.random || 'notset'}</p>
            </div>
        );
      } // render


    } // class DevUnisys

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = DevUnisys;
