/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  This is a REFERENCE IMPLEMENTATION of a settings context for React.
  The actual context and hooks have to be defined in the top level component
  of the actual root view.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { createContext } from 'react';
import { Get, UpdateProperty, UpdateGroup } from './mur-settings-client.ts';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SettingsContext = createContext({ origin: 'mur-settings-context' });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetContext() {
  return SettingsContext;
}

/// HOOKS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Reference Custom Hook: React Hook to manage settings context
 *  This should NOT be imported directly, but rather be copied to
 *  the top-level component that needs it */
function useSettings(initialSettings = {}) {
  //
  const [needsUpdate, triggerUpdate] = React.useState({});

  /** universal get settings */
  const get = dotProp => Get(dotProp);

  /** update property via settings manager, then trigger rerender */
  const updateProperty = async (dotProp, value) => {
    const opResult = await UpdateProperty(dotProp, value);
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
    const opResult = await UpdateGroup(groupName, propObj);
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

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { useSettings, GetContext };
