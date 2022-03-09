/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UNISYS server loader

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const DBG = false;

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UNET      = require('./server-network');
const UDB       = require('./server-database');
const LOGGER    = require('./server-logger');

/// CONSTANTS /////////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS    = require('../system/util/prompts');
const PR         = PROMPTS.Pad('SRV');

/// MODULE VARS ///////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


/// API CREATE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
var UNISYS = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Initialize() is called by brunch-server.js to define the default UNISYS
    network values, so it can embed them in the index.ejs file for webapps
    override = { port }
/*/ UNISYS.InitializeNetwork = override => {
      UDB.InitializeDatabase(override);
      return UNET.InitializeNetwork(override);
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ RegisterHandlers() is called before network is started, so they're
    ready to run. These are server-implemented reserved messages.
/*/ UNISYS.RegisterHandlers = () => {

      UNET.HandleMessage('SRV_REFLECT',function(pkt) {
        pkt.Data().serverSays='REFLECTING';
        pkt.Data().stack.push('SRV_01');
        if (DBG) console.log(PR,sprint_message(pkt));
        // return the original packet
        return pkt;
      });

      UNET.HandleMessage('SRV_REG_HANDLERS',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        // now need to store the handlers somehow.
        let data = UNET.RegisterRemoteHandlers(pkt);
        // or return a new data object that will replace pkt.data
        return data;
      });

      UNET.HandleMessage('SRV_DBGET',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_GetDatabase(pkt);
      });

      UNET.HandleMessage('SRV_DBSET', function (pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_SetDatabase(pkt);
      });

      UNET.HandleMessage('SRV_TEMPLATESAVE', pkt => { // server-database
        if (DBG) console.log(PR, sprint_message(pkt));
        UNET.NetCall('NET_TEMPLATE_UPDATE', pkt.data.template); // Broadcast template to other computers on the net
        return UDB.WriteTemplateTOML(pkt);
      });

      /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      /// TEMPLATE / NODE / EDGE EDITOR LOCKING
      /**
       * Requested by Template.jsx when user wants to edit template
       * @return { templateBeingEdited: boolean, nodeOrEdgeBeingEdited: boolean }
       */
      UNET.HandleMessage('SRV_REQ_TEMPLATE_EDIT', pkt => { // server-database
        if (DBG) console.log(PR, sprint_message(pkt));
        console.log(PR, 'SRV_REQ_TEMPLATE_EDIT', sprint_message(pkt));
        const data = UDB.RequestTemplateEdit();
        const editState = UDB.GetTemplateEditState();
        UNET.NetCall('EDIT_PERMITTED', editState); // Broadcast Lock State
        return data;
      });
      /**
       * Requested by Template.jsx when user is finished editing template
       * @return { templateBeingEdited: boolean, nodeOrEdgeBeingEdited: boolean }
       */
      UNET.HandleMessage('SRV_RELEASE_TEMPLATE_EDIT', pkt => { // server-database
        if (DBG) console.log(PR, sprint_message(pkt));
        console.log(PR, 'SRV_RELEASE_TEMPLATE_EDIT', sprint_message(pkt));
        const data = UDB.ReleaseTemplateEdit();
        UNET.NetCall('EDIT_PERMITTED', data); // Broadcast Lock State
        return data;
      });
      /**
       * @return { templateBeingEdited: boolean, nodeOrEdgeBeingEdited: boolean }
       */
      UNET.HandleMessage('SRV_GET_TEMPLATE_EDIT_STATE', pkt => { // server-database
        if (DBG) console.log(PR, sprint_message(pkt));
        console.log(PR, 'SRV_GET_TEMPLATE_EDIT_STATE', sprint_message(pkt));
        const data = UDB.GetTemplateEditState(pkt);
        return data;
      });
      /**
       * Requested by Node / Edge Editor when user wants to edit node / edge
       * @return { templateBeingEdited: boolean, nodeOrEdgeBeingEdited: boolean }
       */
      UNET.HandleMessage('SRV_REQ_TEMPLATE_LOCK', pkt => { // server-database
        if (DBG) console.log(PR, sprint_message(pkt));
        console.log(PR, 'SRV_REQ_TEMPLATE_LOCK', sprint_message(pkt));
        const data = UDB.RequestTemplateLock(pkt);
        // Broadcast Lock State
        UNET.NetCall('EDIT_PERMITTED', data);
        return data;
      });
      /**
       * @return { templateBeingEdited: boolean, nodeOrEdgeBeingEdited: boolean }
       */
      UNET.HandleMessage('SRV_RELEASE_TEMPLATE_LOCK', pkt => { // server-database
        if (DBG) console.log(PR, sprint_message(pkt));
        console.log(PR, 'SRV_RELEASE_TEMPLATE_LOCK', sprint_message(pkt));
        const data = UDB.ReleaseTemplateLock(pkt);
        // Broadcast Lock State
        UNET.NetCall('EDIT_PERMITTED', data);
        return data;
      });


      /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      /// TEMPLATE EDITING
      UNET.HandleMessage('SRV_GET_TEMPLATETOML_FILENAME', () => {
        return UDB.GetTemplateTOMLFileName();
      })

      UNET.HandleMessage('SRV_DBUPDATE_ALL', function (pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_UpdateDatabase(pkt);
      });

      // receives a packet from a client
      UNET.HandleMessage('SRV_DBUPDATE',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        let data = UDB.PKT_Update(pkt);
        // add src attribute for client SOURCE_UPDATE to know
        // this is a remote update
        data.src = 'remote';
        // fire update messages
        if (data.node) UNET.NetSend('SOURCE_UPDATE',data);
        if (data.edge) UNET.NetSend('EDGE_UPDATE', data);
        if (data.nodeID!==undefined) UNET.NetSend('NODE_DELETE', data);
        if (data.edgeID!==undefined) UNET.NetSend('EDGE_DELETE',data);
        // return SRV_DBUPDATE value (required)
        return { OK:true, info:'SRC_DBUPDATE' };
      });

      UNET.HandleMessage('SRV_DBGETNODEID',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_GetNewNodeID(pkt);
      });

      UNET.HandleMessage('SRV_DBLOCKNODE', function (pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_RequestLockNode(pkt);
      });

      UNET.HandleMessage('SRV_DBUNLOCKNODE',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_RequestUnlockNode(pkt);
      });

      UNET.HandleMessage('SRV_DBLOCKEDGE', function (pkt) {
        if (DBG) console.log(PR, sprint_message(pkt));
        return UDB.PKT_RequestLockEdge(pkt);
      });

      UNET.HandleMessage('SRV_DBUNLOCKEDGE', function (pkt) {
        if (DBG) console.log(PR, sprint_message(pkt));
        return UDB.PKT_RequestUnlockEdge(pkt);
      });

      UNET.HandleMessage('SRV_DBUNLOCKALLNODES', function (pkt) {
        if (DBG) console.log(PR, sprint_message(pkt));
        return UDB.PKT_RequestUnlockAllNodes(pkt);
      });
      UNET.HandleMessage('SRV_DBUNLOCKALLEDGES', function (pkt) {
        if (DBG) console.log(PR, sprint_message(pkt));
        return UDB.PKT_RequestUnlockAllEdges(pkt);
      });
      UNET.HandleMessage('SRV_DBUNLOCKALL', function (pkt) {
        if (DBG) console.log(PR, sprint_message(pkt));
        return UDB.PKT_RequestUnlockAll(pkt);
      });

      UNET.HandleMessage('SRV_DBGETEDGEID', function (pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return UDB.PKT_GetNewEdgeID(pkt);
      });

      UNET.HandleMessage('SRV_LOG_EVENT',function(pkt) {
        if (DBG) console.log(PR,sprint_message(pkt));
        return LOGGER.PKT_LogEvent(pkt);
      });

      // utility function //
      function sprint_message(pkt) {
        return `got '${pkt.Message()}' data=${JSON.stringify(pkt.Data())}`;
      }
    };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/	StartNetwork() is called by brunch-server after the Express webserver
/*/	UNISYS.StartNetwork = () => {
      UNET.StartNetwork();
    };


/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = UNISYS;
