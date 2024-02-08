/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  dc-comments
  
  Methods
  

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// CORE DATA
const USERS = new Map(); // Map<uid, name>
const COMMENTTYPES = new Map(); // Map<typeId, commentTypeObject>
const COMMENTS = new Map(); // Map<cid, commentObject>
/// DERIVED DATA
const ROOTS = new Map(); // Map<cref, comment_id> Root comment for a given collection_ref
const REPLY_ROOTS = new Map(); // Map<comment_id_parent, comment_id> Root comment_id for any given comment. (thread roots)
const NEXT = new Map(); // Map<comment_id_previous, comment_id> Next comment_id that follows the requested comment_id

/// FAKE DATABASE CALLS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// "Load" database data, which are simple arrays

let DB_Users;
let DB_CommentTypes;
let DB_Comments;
let LASTID = -1;

DB_Users = [
  { id: 'Ben32', name: 'BenL' },
  { id: 'Sri64', name: 'SriS' },
  { id: 'Joshua11', name: 'JoshuaD' }
];

DB_CommentTypes = [
  {
    id: 'cmt',
    label: 'COMMENT', // comment type label
    prompts: [
      {
        prompt: 'COMMENT', // prompt label
        help: '',
        feedback: ''
      }
    ]
  },
  {
    id: 'questionresponse',
    label: 'Question or response', // comment type label
    prompts: [
      {
        prompt: 'Question or response', // prompt label
        help: '',
        feedback: ''
      }
    ]
  },
  {
    id: 'consistent',
    label: 'Consistent', // comment type label
    prompts: [
      {
        prompt: 'Consistent', // prompt label
        help: '',
        feedback: ''
      }
    ]
  },
  {
    id: 'understandable',
    label: 'Understandable', // comment type label
    prompts: [
      {
        prompt: 'Understandable', // prompt label
        help: '',
        feedback: ''
      }
    ]
  },
  {
    id: 'understandable',
    label: 'Supported by evidence', // comment type label
    prompts: [
      {
        prompt: 'Supported by evidence', // prompt label
        help: `It is important for a scientific model to be supported by evidence.

Does the evidence we have show that the model works this way?
Is there any contradictory evidence that says the model doesn't work this way?
`,
        feedback: 'Consider pointing out relevant evidence by typing evidence #'
      }
    ]
  },
  {
    id: 'changereason',
    label: 'Change + Reason', // comment type label
    prompts: [
      {
        prompt: 'Change',
        help: 'What change do you want to make?',
        feedback: ''
      },
      {
        prompt: 'Reason',
        help: 'Why do you want to make that change',
        feedback: ''
      }
    ]
  },
  {
    id: 'three',
    label: 'Three Points', // comment type label
    prompts: [
      {
        prompt: 'Point 1',
        help: 'What change do you want to make?',
        feedback: ''
      },
      {
        prompt: 'Point 2',
        help: 'Why do you want to make that change',
        feedback: ''
      },
      {
        prompt: 'Point 3',
        help: 'Why do you want to make that change',
        feedback: ''
      }
    ]
  }
];

DB_Comments = [
  {
    collection_ref: 1,
    comment_id: '1', // thread
    comment_id_parent: '',
    comment_id_previous: '',
    comment_type: 'cmt', // no prompts
    comment_createtime: new Date(),
    comment_modifytime: new Date(),

    commenter_id: 'Ben32',
    commenter_text: ["You're missing a citation."]
  },
  {
    collection_ref: 1,
    comment_id: '2', // reply 1
    comment_id_parent: '1',
    comment_id_previous: '',
    comment_type: 'changereason',
    comment_createtime: new Date(),
    comment_modifytime: new Date(),

    commenter_id: 'Joshua11',
    commenter_text: [
      'I switched this to be fish die',
      "Because that's what the graph shows, thanks!"
    ]
  },
  {
    collection_ref: 1,
    comment_id: '3', // reply 2
    comment_id_parent: '1',
    comment_id_previous: '2',
    comment_type: 'understandable', // no prompts
    comment_createtime: new Date(),
    comment_modifytime: new Date(),

    commenter_id: 'Ben32',
    commenter_text: ['OK nvm.']
  },
  {
    collection_ref: 1,
    comment_id: '4', // thread
    comment_id_parent: '',
    comment_id_previous: '1',
    comment_type: 'cmt', // no prompts
    comment_createtime: new Date(),
    comment_modifytime: new Date(),

    commenter_id: 'Sri64',
    commenter_text: ["I don't think that's a good reason."]
  },
  {
    collection_ref: 1,
    comment_id: '5', // reply 1
    comment_id_parent: '4',
    comment_id_previous: '',
    comment_type: 'three',
    comment_createtime: new Date(),
    comment_modifytime: new Date(),

    commenter_id: 'Ben32',
    commenter_text: [
      'I switched this to be fish die',
      "Because that's what the graph shows, thanks!",
      ''
    ]
  },
  {
    collection_ref: 1,
    comment_id: '6', // thread
    comment_id_parent: '',
    comment_id_previous: '4',
    comment_type: 'cmt', // no prompts
    comment_createtime: new Date(),
    comment_modifytime: new Date(),

    commenter_id: 'Ben32',
    commenter_text: ['The last word.']
  },
  {
    collection_ref: 2,
    comment_id: '7', // thread
    comment_id_parent: '',
    comment_id_previous: '',
    comment_type: 'cmt', // no prompts
    comment_createtime: new Date(),
    comment_modifytime: new Date(),

    commenter_id: 'Joshua11',
    commenter_text: ['A different object.']
  }
];

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_LoadUsers(dbUsers) {
  dbUsers.forEach(u => USERS.set(u.id, u.name));
}
function m_LoadCommentTypes(commentTypes) {
  commentTypes.forEach(t => COMMENTTYPES.set(t.id, t));
}
function m_LoadComments(comments) {
  let lastid = -1;
  comments.forEach(c => {
    COMMENTS.set(c.comment_id, c);
    if (c.comment_id > lastid) lastid = c.comment_id;
  });
  LASTID = lastid;
}

function m_GetNextCommentId() {
  return ++LASTID;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Init() {
  console.log('dc-comments Init');
  // Load Data!
  m_LoadCommentTypes(DB_CommentTypes);
  m_LoadUsers(DB_Users);
  m_LoadComments(DB_Comments);
  if (DBG) console.log('USERS', USERS);
  if (DBG) console.log('COMMENTTYPES', COMMENTTYPES);
  if (DBG) console.log('COMMENTS', COMMENTS);
  // Derive Secondary Values
  m_DeriveValues();
}

function GetUsers() {
  return USERS;
}
function GetUser(uid) {
  return USERS.get(uid);
}
function GetUserName(uid) {
  const u = USERS.get(uid);
  return u !== undefined ? u : 'Not found';
}
function GetCurrentUser() {
  // TODO Placeholder
  return 'Ben32';
}

function GetCommentTypes() {
  return COMMENTTYPES;
}
function GetCommentType(typeid) {
  return COMMENTTYPES.get(typeid);
}

function GetComments() {
  return COMMENTS;
}
function GetComment(cid) {
  return COMMENTS.get(cid);
}

function m_DeriveValues() {
  COMMENTS.forEach(c => {
    if (c.comment_id_parent === '' && c.comment_id_previous === '')
      ROOTS.set(c.collection_ref, c.comment_id);
    if (c.comment_id_parent !== '' && c.comment_id_previous === '')
      REPLY_ROOTS.set(c.comment_id_parent, c.comment_id);
    NEXT.set(c.comment_id_previous, c.comment_id);
  });
  if (DBG) console.log('ROOTS', ROOTS);
  if (DBG) console.log('REPLY_ROOTS', REPLY_ROOTS);
  if (DBG) console.log('NEXT', NEXT);
}

function AddComment(data) {
  if (data.cref === undefined)
    throw new Error('Comments must have a collection ref!');

  const comment_id_parent = data.comment_id_parent || '';
  const comment_id_previous = data.comment_id_previous || '';

  const comment = {
    collection_ref: data.cref,
    comment_id: m_GetNextCommentId(), // thread
    comment_id_parent,
    comment_id_previous,
    comment_type: 'cmt', // default type, no prompts
    comment_createtime: new Date(),
    comment_modifytime: '',

    commenter_id: GetCurrentUser(),
    commenter_text: []
  };
  COMMENTS.set(comment.comment_id, comment);

  m_DeriveValues();

  return comment;
}

function RemoveComment(cid) {
  // TODO Remove parent references
  // TODO Remove previous references
  COMMENTS.delete(cid);
  m_DeriveValues();
  // TODO: Add DB Call round trip
}

/**
 *
 * @param {Object} cobj commentObject
 */
function UpdateComment(cobj) {
  // TODO: Add DB Call round trip
  // Fake modify date until we get DB roundtrip
  cobj.comment_modifytime = new Date();
  COMMENTS.set(cobj.comment_id, cobj);
  console.log('...modify time', cobj.comment_modifytime);
}

/**
 * Get all the comment ids related to a particular collection_ref
 * based on ROOTS.
 * DeriveValues needs to be called before this method can be used.
 * @param {string} cref collection_ref id
 * @returns comment_id[]
 */
function GetThreadedCommentIds(cref) {
  console.log('looking up cref', cref, typeof cref);
  const anchor_comment_ids = [];
  const all_comments_ids = [];
  // 1. Start with Roots
  const rootId = ROOTS.get(cref);
  if (rootId === undefined) return [];
  anchor_comment_ids.push(rootId);
  // 2. Find Next
  // recursively add next
  function getNext(cid) {
    const nextId = NEXT.get(cid);
    if (nextId) return [nextId, ...getNext(nextId)];
    return [];
  }
  anchor_comment_ids.push(...getNext(rootId));
  // 3. Find Replies
  anchor_comment_ids.forEach(cid => {
    // are there replies?
    const reply_root_id = REPLY_ROOTS.get(cid);
    if (reply_root_id) {
      // then recursively find next reply
      all_comments_ids.push(cid, reply_root_id, ...getNext(reply_root_id));
    }
    // else just return the root cid
    else all_comments_ids.push(cid);
  });
  return all_comments_ids;
}
if (DBG) console.log('GetThreadedView', GetThreadedCommentIds('1'));
if (DBG) console.log('GetThreadedView', GetThreadedCommentIds('2'));

/**
 * Get all the comments related to a particular collection_ref
 * @param {string} cref collection_ref id
 * @returns commentObject[]
 */
function GetThreadedCommentData(cref) {
  const all_comments_ids = GetThreadedCommentIds(cref);
  // convert ids to comment objects
  return all_comments_ids.map(cid => COMMENTS.get(cid));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Init,
  // USERS
  GetUsers,
  GetUser,
  GetUserName,
  GetCurrentUser,
  // COMMENT TYPES
  GetCommentTypes,
  GetCommentType,
  // COMMENTS
  GetComments,
  GetComment,
  AddComment,
  RemoveComment,
  UpdateComment,
  GetThreadedCommentIds,
  GetThreadedCommentData
};
