// backend-turnos/routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const { googleCallback } = require('../controllers/authController');
const router = express.Router();

// Registro manual (rol paciente)
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ message: 'El email ya está registrado' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            nombre,
            email,
            password: hashedPassword,
            rol: 'paciente'
        });
        await user.save();
        console.log(' Usuario registrado:');
        res.status(201).json({ message: 'Usuario registrado' });
    } catch (err) {
        console.error(' Error al registrar usuario:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Login manual
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) return res.status(400).json({ message: 'Credenciales inválidas' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ message: 'Credenciales inválidas' });

        const token = jwt.sign({
            id: user._id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
        }, process.env.JWT_SECRET);

        res.json({ token });
    } catch (err) {
        console.error(' Error en login:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Middleware para verificar si es admin
function verificarAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No autorizado' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.rol !== 'administrador') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
        req.usuario = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token inválido' });
    }
}

// Crear secretaria (solo admin)
router.post('/crear-secretaria', verificarAdmin, async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ message: 'El email ya está registrado' });

        const hashed = await bcrypt.hash(password, 10);
        const secretaria = new User({ nombre, email, password: hashed, rol: 'secretaria' });
        await secretaria.save();

        res.status(201).json({ message: 'Secretaria registrada' });
    } catch (err) {
        res.status(500).json({ message: 'Error al registrar secretaria' });
    }
});
/*Ruta temporal para crear un administrador<
router.post('/crear-admin', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ message: 'El email ya está registrado' });

        const hashed = await bcrypt.hash(password, 10);
        const admin = new User({ nombre, email, password: hashed, rol: 'administrador' });
        await admin.save();

        res.status(201).json({ message: 'Administrador registrado correctamente' });
    } catch (err) {
        console.error('Error al crear admin:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});
*/
// Login con Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    googleCallback
);

module.exports = router;
