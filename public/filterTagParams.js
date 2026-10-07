/**
 * Query-param helpers for the ad-list filter row's tags (BR-544 / PRD ct-technical-sdd#544).
 *
 * The tags are a multi-select projection over two params that already exist:
 *   - `f`              account type, a comma-separated list (`p` = Cá nhân, `c` = Môi giới/Bán chuyên)
 *   - `contain_videos` the video filter, `'1'` when on
 *
 * `f` carries values the tag row does not expose — `protection_entitlement` (PTY/GDS/JOB),
 * `i` (Chủ đầu tư, PTY) and `is_shop_verified` (VEH) — which come from the backend's
 * dynamic-filter config. Toggling a tag must APPEND TO or REMOVE FROM the list, never replace
 * it, or selecting a tag would silently discard a filter the user set elsewhere.
 *
 * Serialisation is canonical: the same selection always produces the same string regardless of
 * the order the user clicked in. Without that, `{p, c}` could render as either `f=c,p` or
 * `f=p,c` — one result set behind two URLs, which fragments caches, saved searches and any SEO
 * signal. `c,p` is the canonical form because it is what production already emits
 * (`SORY_BY_TYPE_TEXT[*][0].type`), so this introduces no new spelling of an existing state.
 */

export const ACCOUNT_TYPE_PARAM = 'f';
export const VIDEO_PARAM = 'contain_videos';

export const ACCOUNT_TYPE = {
  PRIVATE: 'p',
  PRO: 'c',
};

/**
 * Canonical ordering for `f`. Values listed here sort first, in this order; anything else — the
 * config-driven options the tag row does not render — keeps its relative order and sorts after.
 */
const CANONICAL_ORDER = [ACCOUNT_TYPE.PRO, ACCOUNT_TYPE.PRIVATE];

const rankOf = (value) => {
  const index = CANONICAL_ORDER.indexOf(value);
  return index === -1 ? CANONICAL_ORDER.length : index;
};

/**
 * Values outside CANONICAL_ORDER sort alphabetically after it. Ordering them by encounter would make
 * the serialisation depend on the order the user happened to click, which is the exact ambiguity
 * this function exists to remove.
 */
const compareValues = (a, b) => rankOf(a) - rankOf(b) || (a < b ? -1 : a > b ? 1 : 0);

/** `'c,p'` -> `['c', 'p']`. Tolerates undefined, empty strings and stray whitespace. */
export const parseAccountTypes = (rawValue) => {
  if (typeof rawValue !== 'string' || rawValue === '') return [];
  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

/** `['p', 'c']` -> `'c,p'`. Returns `undefined` for an empty list so callers can drop the param. */
export const serializeAccountTypes = (values = []) => {
  if (!values.length) return undefined;
  return [...values].sort(compareValues).join(',');
};

export const isAccountTypeSelected = (query, value) =>
  parseAccountTypes(query?.[ACCOUNT_TYPE_PARAM]).includes(value);

/**
 * The video filter has been written as a string, a number and a boolean over its lifetime
 * depending on whether it came from the URL, the router or a component. Accept all of them.
 */
export const isVideoSelected = (query) => {
  const value = query?.[VIDEO_PARAM];
  return value === '1' || value === 1 || value === true || value === 'true';
};

/**
 * Toggle one account-type value, returning a new query object.
 * Removing the last value drops `f` entirely rather than emitting `f=`.
 */
export const toggleAccountType = (query = {}, value) => {
  const nextQuery = { ...query, page: 1 };
  const current = parseAccountTypes(query?.[ACCOUNT_TYPE_PARAM]);
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];

  const serialized = serializeAccountTypes(next);
  if (serialized) {
    nextQuery[ACCOUNT_TYPE_PARAM] = serialized;
  } else {
    delete nextQuery[ACCOUNT_TYPE_PARAM];
  }
  return nextQuery;
};

/** Toggle the video filter, returning a new query object. */
export const toggleVideoFilter = (query = {}) => {
  const nextQuery = { ...query, page: 1 };
  if (isVideoSelected(query)) {
    delete nextQuery[VIDEO_PARAM];
  } else {
    nextQuery[VIDEO_PARAM] = '1';
  }
  return nextQuery;
};

export default {
  ACCOUNT_TYPE,
  ACCOUNT_TYPE_PARAM,
  VIDEO_PARAM,
  parseAccountTypes,
  serializeAccountTypes,
  isAccountTypeSelected,
  isVideoSelected,
  toggleAccountType,
  toggleVideoFilter,
};
