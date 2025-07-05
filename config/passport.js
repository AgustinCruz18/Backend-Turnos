//backend-turnos/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://backend-turnos-1.onrender.com/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google Profile:', profile);
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            // Buscar por email si ya existe uno registrado
            const existingByEmail = await User.findOne({ email: profile.emails?.[0]?.value });
            if (existingByEmail) {
                // Actualizar su googleId si está logueando con Google por primera vez
                existingByEmail.googleId = profile.id;
                await existingByEmail.save();
                user = existingByEmail;
            } else {
                // Crear nuevo usuario
                user = await User.create({
                    googleId: profile.id,
                    nombre: profile.displayName,
                    email: profile.emails?.[0]?.value || `noemail-${profile.id}@fake.com`,
                    rol: 'paciente'
                });
            }
        } else {
            console.log('Usuario ya existente:', user);
        }
        return done(null, user);
    } catch (err) {
        console.error('Error en estrategia Google:', err);
        return done(err, null);
    }
}));
