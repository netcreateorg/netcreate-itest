if (window.NC_DBG) console.log(`inc ${module.id}`);
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    SessionShell handles route-based parameters, updating the SESSION manager
    with pertinent information

    The component stores the credentials
      classId  : null,
      projId   : null,
      hashedId : null,
      groupId  : null,
      isValid  : false

    render() calls one of the following depending on the state of
    SESSION.DecodeToken( token ). It returns an object is isValid prop set.
    The token is by decoding the URL in location.href.

      renderLoggedIn( decoded ) contains an object with the decoded properties
      from the original string, and displays the login state

      renderLogin() shows the login text field.

    When text is changing in Login Field, this.handleChange() is called.
    It gets the value and runs SESSION.DecodeToken() on it.
    It then uses Unisys.SetAppState to set "SESSION" to the decoded value.
    if a groupId is detected, then it forces a redirect.


    A change in logged in status can come from four places:

    1. User has typed in login field.
       => This is handled by `handleChange()`
    2. User has hit the "Login" submit button.
       => This is handled by `onSubmit()`
    3. User has entered a full URL for the first time
       => This is handled by `componentWillMount()`
    4. User has changed an existing URL
       => This does not trigger `compomentWillMount()`
          so it needs special handling.
       Changing the url does trigger:
       * render()
          render is triggered because the props for the token
          passed by the route change.
          And render does detect the correct login state.
          However, if this represents a change in login state,
          the change in state needs to be broadcast.
       * componentDidUpdate()
          componentDidUpdate checks for the change in loggedinIn
          status and sends an AppStateChanged event as needed.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const SETTINGS = require('settings');
const React = require('react');
const PROMPTS = require('system/util/prompts');
const SESSION = require('unisys/common-session');
const PR = PROMPTS.Pad('SessionShell');
const UNISYS = require('unisys/client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these styles are copied from AutoComplete.css
const INPUT_STYLE = {
  border: '1px solid #5F7C8B',
  borderLeft: '0',
  borderRadius: '0 5px 5px 0',
  padding: '0.25rem 0.5rem',
  fontFamily: 'Helvetica, sans-serif',
  fontWeight: 400,
  fontSize: '10px',
  textAlign: 'right',
  textTransform: 'uppercase'
};
const GROUP_STYLE = {
  backgroundColor: '#777',
  color: 'white',
  marginTop: '-10px'
};
const LABEL_STYLE = {
  display: 'inline-block',
  verticalAlign: 'top',
  marginBottom: '0.15rem',
  marginTop: '0.15rem',
  color: '#355869'
};
const LOGIN_BTN_STYLE = {
  padding: '0.25rem 0.5rem',
  fontSize: '10px',
  border: '1px solid #E07141',
  borderRadius: '5px 0 0 5px',
  color: 'white',
  backgroundColor: '#E07141'
};
/// Move login to navbar
const NAV_LOGIN_STYLE = {
  fontSize: '0.8rem',
  zIndex: '2000'
};
const NAV_LOGIN_FEEDBACK_STYLE = {
  paddingRight: '0.5rem'
};
const VALID = {
  color: 'green',
  borderColor: 'green',
  outlineColor: 'green'
};
const INVALID = {
  color: '#C83E3E',
  borderColor: '#C83E3E',
  outlineColor: '#C83E3E'
};

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SessionShell extends UNISYS.Component {
  constructor() {
    super();
    this.renderLogin = this.renderLogin.bind(this);
    this.renderLoggedIn = this.renderLoggedIn.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {
      // `state` tracks the login input field
      token: null,
      classId: null,
      projId: null,
      hashedId: null,
      subId: null,
      groupId: null,
      isValid: false
    };
    this.previousIsValid = false; // to track changes in loggedIn status

    // This will invalidate the token when the server is disconnected
    // but this can be a problem for projects that require login
    // to view the graph.
    // this.OnDisconnect(() => {
    //   const token = this.props.match.params.token;
    //   const decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset);
    //   // invalidate the token and announce it
    //   decoded.isValid = false;
    //   this.SetAppState("SESSION", decoded);
    // });
  }

  /// ROUTE RENDER FUNCTIONS ////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** render successful logged-in
   */
  renderLoggedIn(decoded) {
    if (decoded) {
      let classproj = `${decoded.classId}-${decoded.projId}`;
      // prefix with unicode non-breaking space
      let gid = `\u00A0${decoded.groupId}`;
      let subid = decoded.subId ? `USER\u00A0${decoded.subId}` : '';
      return (
        <div style={NAV_LOGIN_STYLE}>
          <label style={LABEL_STYLE} className="small">
            GROUP{gid}:&nbsp;
            <br />
            {subid}
          </label>
          <label style={LABEL_STYLE} className="small">
            {classproj}-<strong>{decoded.hashedId}</strong>
          </label>
        </div>
      );

      // Old Form above NodeSelector
      // return (
      //   <FormGroup row style={GROUP_STYLE} style={{position:'fixed',top:'5px',right:'5px',zIndex:'2000'}}>
      //     <Col sm={3}>
      //       <Label style={LABEL_STYLE} className="small">
      //         GROUP{gid}
      //         <br />
      //         {subid}
      //       </Label>
      //     </Col>
      //     <Col sm={9} className="text-right">
      //       <Label style={LABEL_STYLE} className="small">
      //         {classproj}-<strong>{decoded.hashedId}</strong>
      //       </Label>
      //     </Col>
      //   </FormGroup>
      // );
    } else {
      return <p>ERROR:renderLoggedIn didn&apos;t get valid decoded object</p>;
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** render must login (readonly)
   *  see common-session.DecodeToken() for details on:
   *    classId, projId, and hashedId are provided by the token
   *    groupId is _calculated_ when all three parts are valid
   *    subId is a string ID<NNN> where <NNN> are digits
   */
  renderLogin() {
    let { token, classId, projId, groupId, subId, hashedId, isValid } = this.state;
    if (token) token = token.toUpperCase();
    let formFeedback, tip, input;
    tip = 'type your login token';
    if (classId) tip = 'token part [1/3]...';
    if (projId) tip = 'token part [2/3]...';
    // groupId isn't part of the token
    // if (groupId) tip = 'Waiting for extra ID...';
    if (hashedId) tip = 'token part [3/3]...';
    // if groupId is defined, then the token is valid
    if (groupId) {
      //
      if (subId === 0) {
        tip = `...optional ID number`;
        input = (
          <input
            name="sessionToken"
            id="sessionToken"
            style={{ ...INPUT_STYLE, ...INVALID }}
            placeholder="CLASSID-PROJID-CODE"
            onChange={this.handleChange}
          />
        );
        formFeedback = (
          <label
            htmlFor="sessionToken"
            style={{ ...NAV_LOGIN_FEEDBACK_STYLE, ...INVALID }}
          >
            <small>{tip}</small>
          </label>
        );
      } /* if subId!==0 */ else {
        tip = 'CLICK LOGIN BUTTON';
        input = (
          <input
            name="sessionToken"
            id="sessionToken"
            style={{ ...INPUT_STYLE, ...VALID }}
            placeholder="CLASSID-PROJID-CODE"
            onChange={this.handleChange}
          />
        );
        formFeedback = (
          <label
            htmlFor="sessionToken"
            style={{ ...NAV_LOGIN_FEEDBACK_STYLE, ...VALID }}
          >
            <small>{tip}</small>
          </label>
        );
      }
    } /* if not groupId*/ else {
      input = (
        <input
          name="sessionToken"
          id="sessionToken"
          style={{ ...INPUT_STYLE, ...INVALID }}
          placeholder="CLASSID-PROJID-CODE"
          onChange={this.handleChange}
        />
      );
      formFeedback = (
        <label
          htmlFor="sessionToken"
          style={{ ...NAV_LOGIN_FEEDBACK_STYLE, ...INVALID }}
        >
          <small>{tip}</small>
        </label>
      );
    }

    return (
      <form
        className="--SessionShell_Login"
        onSubmit={this.onSubmit}
        style={NAV_LOGIN_STYLE}
      >
        {formFeedback}
        <button
          style={LOGIN_BTN_STYLE}
          disabled={!isValid}
          onSubmit={this.onSubmit}
          type="submit"
        >
          LOGIN
        </button>
        {input}
      </form>
    );

    // Old Form above NodeSelector
    // return (
    //   <Form onSubmit={this.onSubmit} style={{position:'fixed',top:'5px',right:'5px',zIndex:'2000'}}>
    //   <FormGroup row>
    //     <Col>
    //       <InputGroup>
    //         {formFeedback}
    //         <InputGroupAddon addonType="prepend"><Button style={{fontSize:'10px'}} color="secondary" size="sm" disabled={!isValid} onSubmit={this.onSubmit}>LOGIN</Button></InputGroupAddon>
    //         {input}
    //       </InputGroup>
    //     </Col>
    //   </FormGroup>
    //   </Form>
    // );
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  componentDidMount() {
    // the code below reads a pre-existing matching path, which may be set
    // to a valid token string AFTER the changeHandler() detected a valid
    // login after a ForceReload. This is a bit hacky and the app would benefit
    // from not relying on forced reloads. See handleChange().
    //
    // This is only called with the initial page load.
    // Subsequent changes to the URL (e.g. changing token directly in the url)
    // do not result in a second componentWillMount call.  These are handled
    // by the componentDidUpdate() call.

    const { routeProps } = SETTINGS.GetRouteInfoFromURL();
    let { token } = routeProps;
    let decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset) || {};
    this.SetAppState('SESSION', decoded);
    this.previousIsValid = decoded.isValid;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  componentDidUpdate(prevProps) {
    // SIDE EFFECT
    // Check for changes in logged in status and
    // trigger AppStateChange if necessary
    const { routeProps } = SETTINGS.GetRouteInfoFromURL();
    let { token } = routeProps;

    if (!token) return; // don't bother to check if this was a result of changes from the form
    let decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset);
    if (decoded.isValid !== this.previousIsValid) {
      this.SetAppState('SESSION', decoded);
      this.previousIsValid = decoded.isValid;
    }
  }

  /// EVENT HANDLERS ////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  handleChange(event) {
    let token = event.target.value;
    let decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset);
    let { classId, projId, hashedId, subId, groupId } = decoded;
    this.setState(decoded);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  onSubmit(event) {
    event.preventDefault();
    if (this.state.isValid) {
      // force a page URL change
      const redirect = `./#/edit/${this.state.token}`;
      window.location.replace(redirect);
      window.location.reload();
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Main Render Function
   */
  render() {
    // FUN FACTS
    // this.state set in constructor
    // this.props.history, location, match added by withRouter(AppShell)
    // way back in init-appshell.jsx

    // if standalone mode, no login possible
    if (UNISYS.IsStandaloneMode()) {
      const { prompt, timestamp } = window.NC_UNISYS.standalone;
      return (
        <div style={NAV_LOGIN_STYLE}>
          <label style={LABEL_STYLE}>{prompt}</label>
        </div>
      );
    }

    const { routeProps } = SETTINGS.GetRouteInfoFromURL();
    let { token } = routeProps;
    // no token so just render login
    if (!token) return this.renderLogin();

    // try to decode token
    let decoded = SESSION.DecodeToken(token, window.NC_CONFIG.dataset);
    if (decoded.isValid) {
      return this.renderLoggedIn(decoded);
    } else {
      return this.renderLogin(token);
    }
  }
} // UNISYS.Component SessionShell

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = SessionShell;
