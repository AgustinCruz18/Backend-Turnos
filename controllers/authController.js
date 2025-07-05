// backend-turnos/controllers/authController.js
const jwt = require('jsonwebtoken');

exports.googleCallback = async (req, res) => {
    const token = jwt.sign({
        id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        rol: req.user.rol
    }, process.env.JWT_SECRET);

    // Redirige al frontend en Netlify
    const redirectUrl = `https://turnos-psw.netlify.app/dashboard-paciente/${req.user._id}?token=${token}`;
    res.redirect(redirectUrl);
};
