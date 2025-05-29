/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Settings Context
  
  Centralized React Context for Settings Manager
  
  Usage:
    - wrap your component tree with <SettingsProvider>
    - use the `useSettings` hook in your components

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { createContext } from 'react';
import { Get, UpdateProperty, UpdateGroup } from './mur-settings-client.ts';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SettingsContext = createContext({ origin: 'mur-settings-context' });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetSettingsContext() {
  return SettingsContext;
}

/// HOOKS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React Hook to manage settings context. Note that this module is
 *  defined in a different React context than the legacy app, so you
 *  have to duplicate it over there somewhere to match both instance
 *  and potentailly the version */
function useSettings() {
  const [lastSettingsUpdate, updateSettings] = React.useState({});

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
    updateSettings(opResult); // trigger a rerender
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
    updateSettings(opResult); // trigger a rerender
    return true;
  };

  return {
    // to trigger rerender
    lastSettingsUpdate,
    forceUpdate: () => updateSettings({ timestamp: new Date().toISOString() }),
    // api
    get,
    updateProperty,
    updateGroup
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { useSettings, GetSettingsContext };
