//backend-turnos/middleware/roles.js
const jwt = require('jsonwebtoken');

function verificarRol(rolesPermitidos) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'Token no enviado' });

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!rolesPermitidos.includes(decoded.rol)) {
                return res.status(403).json({ message: 'Acceso denegado' });
            }
            req.usuario = decoded;
            next();
        } catch (err) {
            res.status(401).json({ message: 'Token inválido' });
        }
    };
}

module.exports = { verificarRol };
