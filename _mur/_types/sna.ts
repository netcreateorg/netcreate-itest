/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SRI NEW ARCHITECTURE (SNA) TYPES

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import type { DataObj, OpResult } from './ursys.ts';

/// SNA MODULE DEFAULT EXPORT /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// an SNA module uses the sna-hooks, sna-urnet, and sna-monitor modules to
/// add itself to the overall SNA lifecycle.
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type AddComponentOpt = {
  f_AddComponent: MOD_AddComponent;
};
export type MOD_PreConfig = (DataObj) => void; // called before lifecycle
export type MOD_PreHook = () => void; // called before lifecycle
export type MOD_AddComponent = (AddComponentOpt) => void; // called during reg
export type MOD_EventRegister = (evt: string, notifyCB: Function) => void;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for code modules, exporting default SNA with SNA_Component is a suggested
/// practice
export interface SNA_ComponentProps {
  _name?: string;
  AddComponent?: MOD_AddComponent;
  PreConfig?: MOD_PreConfig;
  PreHook?: MOD_PreHook;
  Subscribe?: MOD_EventRegister;
  Unsubscribe?: MOD_EventRegister;
}
export type {
  SNA_EvtName,
  SNA_EvtHandler,
  SNA_EvtOn,
  SNA_EvtOff,
  SNA_EvtOnce
} from './ursys.ts';
