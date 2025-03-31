/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Settings Provider
  notes https://dsriseah.com/memo/webdev/ui/react-context/

  The initial state of the settings is provided in the value prop passed
  to the SettingsProvider component.

  Per React convention, if the contents of any props change, then the
  component rerenders. If the component has children, they will also
  be rerendered. Therefore, by changing value, we can trigger a rerender of
  the UI. The value is a setState() hook getter, which can be changed outside
  of the component, allowing child components to trigger a rerender.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const { Settings } = require('ursys-min');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a react context object, providing access to the values prop of the
 *  SettingsProvider */
const Context = Settings.GetContext();

/// CUSTOM HOOK FOR SETTINGS CONTEXT //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React Hook to manage settings context */
function useSettings(initialSettings = {}) {
  //
  const [needsUpdate, triggerUpdate] = React.useState({ init: '' });

  /** universal get settings */
  const get = dotProp => Settings.Get(dotProp);

  /** update property via settings manager, then trigger rerender */
  const updateProperty = async (dotProp, value) => {
    const opResult = await Settings.UpdateProperty(dotProp, value);
    const { error, changed } = opResult;
    if (error) {
      console.error(`updateProperty: ${error}`);
      return false; // indicate failure
    }
    triggerUpdate(opResult); // trigger a rerender
    return true;
  };

  /** update group of properties via settings manager, then trigger rerender */
  const updateGroup = async (groupName, propObj) => {
    const opResult = await Settings.UpdateGroup(groupName, propObj);
    const { error, changed } = opResult;
    if (error) {
      console.error(`updateGroup: ${error}`);
      return false;
    }
    triggerUpdate(opResult); // trigger a rerender
    return true;
  };

  return {
    // to trigger rerender
    needsUpdate,
    // api
    get,
    updateProperty,
    updateGroup
  };
}

/// FUNCTIONAL COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SettingsProvider(props) {
  const { children, settings } = props;

  // Provide the settings context to child components
  return (
    <Context.Provider settingsUpdate={settings.needsUpdate}>
      {/* Render the children components */}
      {children}
    </Context.Provider>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  SettingsProvider,
  //
  useSettings
};
