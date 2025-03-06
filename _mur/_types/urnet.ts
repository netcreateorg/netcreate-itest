/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS NETWORK (URNET) TYPES

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// BASIC NETPACKET TYPES //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** note that these string types have mirrored declarations in util-urnet.ts **/
export type NP_AddrPre = '???' | 'UR_' | 'WSS' | 'UDS' | 'MQT' | 'SRV';
export type NP_Address = `${NP_AddrPre}${number}`; // range set by UADDR_DIGITS
export type NP_ID = `pkt[${NP_Address}:${number}]`;
export type NP_Chan = 'SYNC' | 'NET' | 'SRV' | 'LOCAL' | '';
export type NP_Type =
  | 'ping'
  | 'signal'
  | 'send'
  | 'call'
  | '_auth' // special packet
  | '_reg' // special packet
  | '_decl'; // special packet
export type NP_Msg = `${NP_Chan}${string}`; // e.g. 'NET:HELLO' or 'HELLO'
export type NP_Data = any;
export type NP_Dir = 'req' | 'res';

/// NETPACKET-RELATED TYPES ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type NP_Hash = `${NP_Address}:${NP_ID}`; // for endpoint transactions
export type NP_Options = {
  // for packet creation
  dir?: NP_Dir;
  rsvp?: boolean;
};

/// INTERFACES ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NetMessages are the encapsulated MESSAGE+DATA that are sent over URNET,
 *  with additional metadata to help with request/response and logging.
 *  This defines the data structure only. See NetPacket class for more.
 */
export interface I_NetMessage {
  id: NP_ID;
  msg_type: NP_Type;
  msg: NP_Msg;
  data: NP_Data;
  src_addr: NP_Address;
  hop_dir: NP_Dir;
  hop_rsvp?: boolean;
  hop_seq: NP_Address[];
  hop_log: string[];
  err?: string;
}
/** NM_Handler is a function that processes a NetMessage */
export type NM_Handler = (data: NP_Data, pkt?: I_NetMessage) => NP_Data | void;

/// LOCAL TYPES ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** the function that sends a packet to the wire */
export type NS_SendFunc = (pkt: I_NetMessage) => void;
export type NS_DataFunc = (data: any) => void;
export type NS_CloseFunc = () => void;
export type NS_GetConfigFunc = () => NP_Data;
export type NS_Options = {
  send: NS_SendFunc;
  onData: NS_DataFunc;
  close: NS_CloseFunc;
  getConfig?: NS_GetConfigFunc;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** this is the socket-ish object that we use to send data to the wire */
export interface I_NetSocket {
  // essential socket methods that rely on provided NS_Options
  send: NS_SendFunc; // method send pkt TO other side
  onData: NS_DataFunc; // method receive pkt FROM other side
  close: NS_CloseFunc; // method close connection
  getConfig?: NS_GetConfigFunc; // method get configuration
  //
  connector?: any; // the original connection object (if needed)
  uaddr?: NP_Address; // assigned uaddr for this socket-ish object
  auth?: any; // whatever authentication is needed for this socket
  msglist?: NP_Msg[]; // messages queued for this socket
  age?: number; // number of seconds since this socket was used
  label?: string; // name of the socket-ish object
  authenticated?: () => boolean;
}
