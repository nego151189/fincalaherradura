/* /js/auth.js — Bootstrap de login anónimo (STRICT MODE)
   - Sin imports ESM
   - Usa firebase compat global (firebase.auth)
   - Persis. LOCAL para recordar sesión en el dispositivo
   - Expone window.USER_UID para depuración rápida
*/
// 🔧 Modificado: nuevo archivo

(function(){
  if (!window.firebase || !window.auth){
    console.warn('[auth.js] firebase/auth no inicializado aún.');
    // Intento de obtener instancias compat si solo existe firebase global
    try{
      window.auth = firebase.auth();
      window.db   = window.db || firebase.firestore();
    }catch(e){}
  }

  // Establecer persistencia local (recuerda sesión)
  try {
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch(function(err){ console.warn('[auth.js] setPersistence:', err && err.message); });
  } catch(e){}

  // Asegurar sesión anónima; si ya hay usuario, no hace nada
  function ensureAnon(){
    return new Promise(function(resolve){
      auth.onAuthStateChanged(function(user){
        if (user){
          window.USER_UID = user.uid;
          resolve(user);
        } else {
          firebase.auth().signInAnonymously()
            .then(function(cred){
              window.USER_UID = cred.user && cred.user.uid;
              resolve(cred.user);
            })
            .catch(function(err){
              console.warn('[auth.js] signInAnonymously fallo:', err && err.message);
              resolve(null);
            });
        }
      });
    });
  }

  // Ejecutar inmediatamente
  ensureAnon();

  // Utilidad opcional para otras páginas
  window.ensureAnonymousSession = ensureAnon;
})();
