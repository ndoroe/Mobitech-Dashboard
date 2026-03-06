/**
 * Central Africa Time (CAT / UTC+2) date helpers.
 * All server-side dates should use these helpers to ensure consistent CAT timestamps.
 */

const CAT_TZ = "Africa/Harare"; // IANA zone for CAT (UTC+2)
const CAT_OFFSET_MS = 2 * 60 * 60 * 1000; // +2 hours in milliseconds

/**
 * Get a Date object shifted to CAT.
 * Useful when you need .getFullYear(), .getMonth(), .getDate() in CAT.
 * NOTE: The returned Date's internal UTC value is shifted — use only for
 * extracting year/month/day/hour, NOT for direct comparison with other Dates.
 * @param {Date} [date] - optional base date (defaults to now)
 * @returns {Date}
 */
function catDate(date) {
  const d = date ? new Date(date) : new Date();
  return new Date(d.getTime() + CAT_OFFSET_MS);
}

/**
 * Format a date as 'YYYY-MM-DD' in CAT.
 * @param {Date} [date]
 * @returns {string}
 */
function catDateStr(date) {
  const d = catDate(date);
  return d.toISOString().split("T")[0];
}

/**
 * Format a date as 'YYYY-MM-DD HH:mm:ss' in CAT — ready for MySQL DATETIME.
 * @param {Date} [date]
 * @returns {string}
 */
function catDateTimeStr(date) {
  const d = catDate(date);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Get start-of-day in CAT as SQL string: 'YYYY-MM-DD 00:00:00'
 * @param {Date} [date]
 * @returns {string}
 */
function catStartOfDay(date) {
  return catDateStr(date) + " 00:00:00";
}

/**
 * Get end-of-day in CAT as SQL string: 'YYYY-MM-DD 23:59:59'
 * @param {Date} [date]
 * @returns {string}
 */
function catEndOfDay(date) {
  return catDateStr(date) + " 23:59:59";
}

/**
 * Human-readable CAT timestamp for display / logging.
 * e.g. "2026/03/06, 11:50:00 CAT"
 * @param {Date} [date]
 * @returns {string}
 */
function catTimestamp(date) {
  const d = date || new Date();
  return (
    d.toLocaleString("en-ZA", { timeZone: CAT_TZ, hour12: false }) + " CAT"
  );
}

/**
 * Format a date for display using a locale string in CAT.
 * @param {Date} [date]
 * @param {string} locale - e.g. 'en-US'
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
function catLocaleString(date, locale, options) {
  const d = date || new Date();
  return d.toLocaleString(locale || "en-ZA", { ...options, timeZone: CAT_TZ });
}

module.exports = {
  CAT_TZ,
  catDate,
  catDateStr,
  catDateTimeStr,
  catStartOfDay,
  catEndOfDay,
  catTimestamp,
  catLocaleString,
};
