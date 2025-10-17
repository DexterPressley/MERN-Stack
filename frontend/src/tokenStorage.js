// src/tokenStorage.js
export function storeToken(tok) {
  try {
    // Accept either { accessToken } or { jwtToken } or a raw string
    const val =
      (tok && typeof tok === 'object' && (tok.accessToken || tok.jwtToken)) ||
      (typeof tok === 'string' ? tok : '');

    if (!val) return;
    localStorage.setItem('token_data', val);
  } catch (e) {
    console.log(e);
  }
}

export function retrieveToken() {
  try {
    return localStorage.getItem('token_data');
  } catch (e) {
    console.log(e);
    return null;
  }
}

