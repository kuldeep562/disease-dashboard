/* auth.js — Authentication & session management */

const Auth = (() => {
  const KEY = 'mw_session';

  function getSession() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  }
  function setSession(data) { localStorage.setItem(KEY, JSON.stringify(data)); }
  function clearSession()   { localStorage.removeItem(KEY); }
  function isLoggedIn()     { return !!getSession()?.token; }
  function getUser()        { return getSession()?.user || null; }

  /**
   * Returns: { success: true } on login
   *          { success: false, message: '...' } on failure
   */
  async function login(username, password) {
    const res = await API.login(username, password);

    if (res?.ok && res.token) {
      // Store token + user in localStorage
      setSession({ token: res.token, user: res.user, offline: res.offlineMode || false });
      return { success: true };
    }

    // Return the human-readable error message back to the login form
    return {
      success: false,
      message: res?.message || 'Login failed. Please try again.',
    };
  }

  function logout() {
    clearSession();
    location.reload();
  }

  return { isLoggedIn, getUser, login, logout };
})();
