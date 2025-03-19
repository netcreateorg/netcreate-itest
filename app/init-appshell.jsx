/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    init-appshell.jsx
    application shell loaded and rendered in init.jsx

    These are the top-level React components ("view").

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// REACT LIBRARIES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const React = require('react');
const UNISYS = require('unisys/client');

/// 1. MAIN VIEWS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SETTINGS = require('settings');
const NetCreate = require('view/netcreate/NetCreate');
// const AppDefault = require('view/default/AppDefault');
// const HTMLFrame = require('view/html-frame/HTMLFrame');

/// APPLICATION NAVBAR + ROUTER VIEW //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The application shell consists of a navbar implemented with Reactstrap
 *  components.
 */
class AppShell extends UNISYS.Component {
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.state = {
      isOpen: false
    };
    // bind handler
    this.redirect = this.redirect.bind(this);
    // add UNISYS message for redirects
    this.HandleMessage('SHELL_REDIRECT', this.redirect);
  }
  /** Handle changes in state of his toggle switch */
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  /** Called by SHELL_REDIRECT unisys message */
  redirect(data) {
    let { redirect } = data;
    this.props.history.push(redirect);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Draw top navbar w/ menus and the <NetCreate> view
   */
  render(props) {
    const { route, routeProps } = SETTINGS.GetRouteInfoFromURL(window.location.href);
    const isLocalHost = SETTINGS.IsLocalHost();
    return (
      <div
        className="--AppShell"
        style={{
          display: 'flex',
          flexFlow: 'column nowrap',
          width: '100%',
          height: '100vh'
        }}
      >
        <NetCreate />
      </div>
    );
  } // render()
} // AppShell()

/// EXPORT REACT CLASS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = AppShell;
