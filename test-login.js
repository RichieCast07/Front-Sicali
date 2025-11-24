const usuario = 'carlos.garcia';
const password = 'Director2024!';

// Simular el flujo de login
console.log('=== TEST DE LOGIN ===');
console.log('Usuario:', usuario);
console.log('Password:', password);

// Simular datos del backend
const usuarios = [
    {
        id_usuario: 16,
        nombre: 'Carlos',
        ape_p: 'García',
        ape_m: 'Hernández',
        usuario: 'carlos.garcia',
        password: 'Director2024!',
        rol: 'admin',
        estado: 'Activo',
        sexo: 'M'
    }
];

// Buscar usuario
const user = usuarios.find(u => u.usuario === usuario && u.password === password);

if (!user) {
    console.log('❌ ERROR: Usuario o contraseña incorrectos');
    process.exit(1);
}

if (user.estado.toLowerCase() !== 'activo') {
    console.log('❌ ERROR: Usuario inactivo');
    process.exit(1);
}

console.log('✅ Login exitoso');
console.log('Usuario encontrado:', user.nombre, user.ape_p);
console.log('Rol:', user.rol);

// Generar token
const token = Buffer.from(`${user.id_usuario}:${user.usuario}:${Date.now()}`).toString('base64');
console.log('Token generado:', token);

// Simular objeto guardado en localStorage
const currentUser = {
    id_usuario: user.id_usuario,
    usuario: user.usuario,
    nombre: user.nombre,
    ape_p: user.ape_p,
    ape_m: user.ape_m,
    rol: user.rol,
    estado: user.estado,
    sexo: user.sexo
};

console.log('\nDatos guardados en localStorage.currentUser:');
console.log(JSON.stringify(currentUser, null, 2));

// Verificar rol para redirección
const role = user.rol.toLowerCase();
console.log('\nRol normalizado:', role);

const redirectMap = {
    docente: './pages/bienvenidas/bienvenida Docente.html',
    admin: './pages/bienvenidas/bienvenida Director.html',
    tutor: './pages/bienvenidas/bienvenida Tutor.html',
    estudiante: './pages/bienvenidas/bienvenida Estudiante.html'
};

const target = redirectMap[role] || './index.html';
console.log('Redirigiendo a:', target);

// Verificar que el usuario tendría acceso a la página
const allowedRoles = ['admin']; // bienvenida Director.html está protegida para admin
const hasAccess = allowedRoles.includes(role);
console.log('\n=== VERIFICACIÓN DE ACCESO ===');
console.log('Roles permitidos en página destino:', allowedRoles);
console.log('Rol del usuario:', role);
console.log('¿Tiene acceso?:', hasAccess ? '✅ SÍ' : '❌ NO - SERÁ REDIRIGIDO');

// Test de getCurrentUser simulado
console.log('\n=== SIMULACIÓN RouteGuard.getCurrentUser() ===');
const userJSON = JSON.stringify(currentUser);
const parsed = JSON.parse(userJSON);
console.log('Usuario parseado:', parsed);
console.log('¿Tiene id_usuario?:', !!parsed.id_usuario);
console.log('¿Tiene rol?:', !!parsed.rol);
console.log('getCurrentUser retornaría:', parsed.id_usuario && parsed.rol ? 'Usuario válido ✅' : 'null ❌');
