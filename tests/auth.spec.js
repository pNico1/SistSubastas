/* ============================================================================
 *  Pruebas de comportamiento de LOGIN y REGISTRO (errores).
 *  Corre con:  node entrega2/tests/auth.spec.js
 *
 *  Verifica las REGLAS de validacion del front y de errores del back
 *  (espejo de LoginScreen/RegisterScreen y de AuthService). No levanta el
 *  servidor; valida la logica de los casos de error caso por caso.
 *  Para tests sobre el codigo real del backend, ver AuthServiceTest.java.
 * ========================================================================== */

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name); }
}
function section(t) { console.log('\n== ' + t + ' =='); }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// ---- FRONT: validacion de LOGIN (espejo de LoginScreen.validate) ----
function validateLogin({ email, password }) {
  const e = {};
  if (!email.trim()) e.email = 'El email es obligatorio';
  else if (!EMAIL_RE.test(email)) e.email = 'Email invalido';
  if (!password) e.password = 'La contrasenia es obligatoria';
  return e;
}

// ---- FRONT: validaciones de REGISTRO (espejo de RegisterScreen) ----
function validateStep1(f) {
  const e = {};
  if (!f.nombre.trim()) e.nombre = 1;
  if (!f.apellido.trim()) e.apellido = 1;
  if (!f.email.trim()) e.email = 1;
  else if (!EMAIL_RE.test(f.email)) e.email = 1;
  if (!f.aceptaPrivacidad) e.aceptaPrivacidad = 1;
  if (!f.aceptaTerminos) e.aceptaTerminos = 1;
  return e;
}
function validateStep2(f) {
  const e = {};
  if (f.paisOrigenId == null) e.paisOrigenId = 1;
  if (!f.calle.trim()) e.calle = 1;
  if (!f.ciudad.trim()) e.ciudad = 1;
  if (!f.provincia.trim()) e.provincia = 1;
  return e;
}
function validateStep3(f) {
  const e = {};
  if (!f.documento.trim()) e.documento = 1;
  return e;
}

// ---- BACK: reglas de AuthService (espejo) ----
function registerErrors({ emailExiste, docExiste, paisExiste }) {
  if (emailExiste) return { status: 409, code: 'EMAIL_ALREADY_REGISTERED' };
  if (docExiste) return { status: 409, code: 'DOCUMENT_ALREADY_REGISTERED' };
  if (!paisExiste) return { status: 422, code: 'INVALID_COUNTRY' };
  return null;
}
function loginError({ existe, passwordOk, estado }) {
  if (!existe || !passwordOk) return { status: 401, code: 'INVALID_CREDENTIALS' };
  if (estado === 'suspended') return { status: 403, code: 'ACCOUNT_SUSPENDED' };
  return null; // active/pending/registration_incomplete -> login ok; el front redirige por estado
}
function verifyEmailError({ usuarioExiste, yaVerificado, tokenExiste, usado, expirado }) {
  if (!usuarioExiste) return { status: 422, code: 'CODE_INVALID' };
  if (yaVerificado) return { ok: 'El email ya estaba verificado' };
  if (!tokenExiste) return { status: 422, code: 'CODE_INVALID' };
  if (usado) return { status: 422, code: 'CODE_INVALID' };
  if (expirado) return { status: 410, code: 'CODE_EXPIRED' };
  return { ok: 'Email verificado correctamente' };
}
function generarCodigo() { return String(Math.floor(Math.random() * 1000000)).padStart(6, '0'); }
function claveToken(id, codigo) { return id + ':' + codigo; }

// ============================ CASOS ============================

section('LOGIN - validacion de campos (front)');
check('email vacio -> error email', validateLogin({ email: '', password: 'x' }).email);
check('email sin formato -> error email', validateLogin({ email: 'juan', password: 'x' }).email);
check('email "a@b" sin punto -> error email', validateLogin({ email: 'a@b', password: 'x' }).email);
check('password vacia -> error password', validateLogin({ email: 'juan@email.com', password: '' }).password);
check('datos validos -> sin errores', Object.keys(validateLogin({ email: 'juan@email.com', password: 'Password123!' })).length === 0);

section('LOGIN - errores del backend');
check('email inexistente -> 401 INVALID_CREDENTIALS', loginError({ existe: false, passwordOk: false, estado: 'active' }).code === 'INVALID_CREDENTIALS');
check('password incorrecta -> 401 INVALID_CREDENTIALS', loginError({ existe: true, passwordOk: false, estado: 'active' }).code === 'INVALID_CREDENTIALS');
check('mismo codigo p/ inexistente y password mala (anti-enumeracion)',
  loginError({ existe: false, passwordOk: false, estado: 'active' }).code === loginError({ existe: true, passwordOk: false, estado: 'active' }).code);
check('cuenta pendiente + password ok -> sin error de login', loginError({ existe: true, passwordOk: true, estado: 'pending_verification' }) === null);
check('cuenta suspendida -> 403 ACCOUNT_SUSPENDED', loginError({ existe: true, passwordOk: true, estado: 'suspended' }).code === 'ACCOUNT_SUSPENDED');
check('registro incompleto + password ok -> sin error de login', loginError({ existe: true, passwordOk: true, estado: 'approved' }) === null);
check('cuenta activa + password ok -> sin error', loginError({ existe: true, passwordOk: true, estado: 'active' }) === null);

section('REGISTRO paso 1 - datos + aceptaciones');
const base1 = { nombre: 'Juan', apellido: 'Perez', email: 'juan@email.com', aceptaPrivacidad: true, aceptaTerminos: true };
check('todo ok -> sin errores', Object.keys(validateStep1(base1)).length === 0);
check('sin nombre -> error', validateStep1({ ...base1, nombre: '' }).nombre);
check('sin apellido -> error', validateStep1({ ...base1, apellido: '' }).apellido);
check('email invalido -> error', validateStep1({ ...base1, email: 'no-es-mail' }).email);
check('sin aceptar privacidad -> error', validateStep1({ ...base1, aceptaPrivacidad: false }).aceptaPrivacidad);
check('sin aceptar terminos -> error', validateStep1({ ...base1, aceptaTerminos: false }).aceptaTerminos);
check('documento NO se pide en paso 1', validateStep1(base1).documento === undefined);

section('REGISTRO paso 2 - ubicacion');
const base2 = { paisOrigenId: 1, calle: 'Av Siempre Viva 123', ciudad: 'Springfield', provincia: 'BA' };
check('todo ok -> sin errores', Object.keys(validateStep2(base2)).length === 0);
check('sin pais -> error', validateStep2({ ...base2, paisOrigenId: null }).paisOrigenId);
check('sin calle -> error', validateStep2({ ...base2, calle: '' }).calle);
check('sin ciudad -> error', validateStep2({ ...base2, ciudad: '' }).ciudad);
check('sin provincia -> error', validateStep2({ ...base2, provincia: '' }).provincia);
check('zip opcional (no rompe)', Object.keys(validateStep2({ ...base2, zip: '' })).length === 0);

section('REGISTRO paso 3 - documento');
check('documento vacio -> error', validateStep3({ documento: '' }).documento);
check('documento presente -> ok', Object.keys(validateStep3({ documento: '30123456' })).length === 0);

section('REGISTRO - errores del backend');
check('email ya registrado -> 409', registerErrors({ emailExiste: true, docExiste: false, paisExiste: true }).code === 'EMAIL_ALREADY_REGISTERED');
check('documento ya registrado -> 409', registerErrors({ emailExiste: false, docExiste: true, paisExiste: true }).code === 'DOCUMENT_ALREADY_REGISTERED');
check('pais inexistente -> 422 INVALID_COUNTRY', registerErrors({ emailExiste: false, docExiste: false, paisExiste: false }).code === 'INVALID_COUNTRY');
check('registro valido -> sin error', registerErrors({ emailExiste: false, docExiste: false, paisExiste: true }) === null);

section('VERIFICACION DE EMAIL por codigo');
check('email inexistente -> CODE_INVALID', verifyEmailError({ usuarioExiste: false }).code === 'CODE_INVALID');
check('codigo inexistente -> CODE_INVALID', verifyEmailError({ usuarioExiste: true, tokenExiste: false }).code === 'CODE_INVALID');
check('codigo ya usado -> CODE_INVALID', verifyEmailError({ usuarioExiste: true, tokenExiste: true, usado: true }).code === 'CODE_INVALID');
check('codigo expirado -> 410 CODE_EXPIRED', verifyEmailError({ usuarioExiste: true, tokenExiste: true, usado: false, expirado: true }).code === 'CODE_EXPIRED');
check('codigo correcto -> verificado', verifyEmailError({ usuarioExiste: true, tokenExiste: true, usado: false, expirado: false }).ok === 'Email verificado correctamente');
check('email ya verificado -> mensaje idempotente', verifyEmailError({ usuarioExiste: true, yaVerificado: true }).ok != null);

section('CODIGO de verificacion (formato)');
let all6 = true; for (let i = 0; i < 1000; i++) if (!/^\d{6}$/.test(generarCodigo())) all6 = false;
check('siempre 6 digitos (1000 muestras)', all6);
check('claveToken combina id:codigo', claveToken(10, '123456') === '10:123456');

// ============================ RESUMEN ============================
console.log('\n----------------------------------------');
console.log(`RESULTADO: ${pass} PASS, ${fail} FAIL  (total ${pass + fail})`);
process.exit(fail === 0 ? 0 : 1);
