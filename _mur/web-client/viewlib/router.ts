/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SNA Router
  loads root views from the views directory, based on #hash.html
  also inserts css object into head matching #hash.css

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let VIEW_ANCHOR: HTMLElement | null = null;
let DBG = true;
const LOG = console.log.bind(console);

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: Decode location #hash/param/param
 *  returns params in-order, separated by slashes
 *  also scans for key/value pairs separate
 *  @returns { view: string, params: string[], values: { k: string, v: string }[] }
 */
function m_DecodeLocationHash() {
  const hash = window.location.hash;
  const [hh, qq] = hash.split('?');
  const bits = hh.split('/');
  let [view, ...args] = bits;
  if (view.startsWith('#')) view = view.slice(1);
  // does args have any illegal '?', '&', '=' characters?
  let illegal = args.filter(
    p => p.includes('?') || p.includes('&') || p.includes('=')
  );
  if (illegal.length) return { error: 'invalid hash', hash };
  if (qq) {
    const params = new URLSearchParams(qq);
    const values = {};
    [...params].map(([k, v]) => (values[k] = v === '' ? true : v));
    return { hash, view, args, values };
  } else return { hash, view, args };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: replace the view anchor with a new view. The view anchor is
 *  <div id="shell-view"> and new view is <div>...fragment...</div>,
 *  so we copy id and class from the anchor to the new view. This ensures
 *  that shell's child hierarchy is maintained, so main css layout rules
 *  are not broken. */
function m_ReplaceViewAnchorWith(newView: HTMLElement) {
  // clone the attributes from the anchor to the new view
  newView.id = VIEW_ANCHOR.id;
  newView.className = VIEW_ANCHOR.className;
  VIEW_ANCHOR.replaceWith(newView);
  VIEW_ANCHOR = newView;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: route to the page and load dependent assets */
async function m_RouteHash(event?: HashChangeEvent) {
  // proceed to load the new content]
  const { error, hash, view, args, values } = m_DecodeLocationHash();
  if (error) {
    VIEW_ANCHOR.innerHTML = `[Invalid Hash ${hash}]`;
    return;
  }
  // if no view is defined then we are done
  if (!view) {
    VIEW_ANCHOR.innerHTML = `[no default view defined in router]`;
    return;
  }
  const res = await fetch(`views/${view}.html`);
  if (!res.ok) {
    console.error(`Failed to route to ${view}`);
    VIEW_ANCHOR.innerHTML = `[Unroutable Hash #${view}]`;
    return;
  }

  const html = await res.text();
  const newView = document.createElement('div');
  newView.innerHTML = html;

  // look for script content to append to the new view
  newView.querySelectorAll('script').forEach(s => {
    const js = document.createElement('script');
    js.textContent = s.textContent;
    js.type = 'module';
    // replace the unparsed script with the new one
    // which executes immediately
    s.replaceWith(js);
  });

  if (DBG) {
    LOG(
      `router: %c'views/${view}.html'%c fragment fetched`,
      'color: darkgreen',
      'color:auto'
    );
  }

  // get the data-css and data-js attributes
  const viewRoot = newView.children[0]; // div > fragment html
  if (viewRoot !== undefined) {
    let cssFile = viewRoot.getAttribute('data-viewcss');
    let jsFile = viewRoot.getAttribute('data-viewjs');

    // insert a css load for the view
    if (cssFile) {
      if (cssFile.endsWith('.css')) cssFile = cssFile.slice(0, -4);
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = `views/${cssFile}.css`;
      document.head.appendChild(css);
    } else if (DBG) {
      LOG(
        `router: %c'data-viewcss'%c attribute skipped`,
        'color: darkgreen',
        'color:auto'
      );
    }
    // insert a js file to the view itself
    if (jsFile) {
      if (jsFile.endsWith('.js')) jsFile = jsFile.slice(0, -3);
      const js = document.createElement('script');
      js.src = `/js/${jsFile}.js`;
      js.type = 'module';
      viewRoot.appendChild(js);
    } else if (DBG) {
      LOG(
        `router: %c'data-viewjs'%c attribute skipped'`,
        'color: darkgreen',
        'color:auto'
      );
    }
  } else {
    console.warn(
      `router: %c'${view}.html'%c has no root element; skipped css/js sideloading`,
      'color: darkgreen',
      'color:auto'
    );
  }
  m_ReplaceViewAnchorWith(newView);
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: add handlers if not already added */
function AttachRouter(e: HTMLElement, defaultHash?: string) {
  if (VIEW_ANCHOR) return; // already initialized
  window.addEventListener('hashchange', m_RouteHash);
  window.addEventListener('load', m_RouteHash);
  VIEW_ANCHOR = e;
  if (typeof defaultHash !== 'string') return;
  if (!defaultHash.startsWith('#')) console.warn('defaultHash must start with #');
  if (window.location.hash === defaultHash) return;
  window.location.hash = defaultHash;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { AttachRouter };
export { DeclareComponents } from './webc/auto-webc-imports.ts';
