// backend-turnos/controllers/mercadoPagoController.js
const axios = require('axios');
require('dotenv').config();

const Turno = require('../models/Turno');

const mercadoPagoCtrl = {};

mercadoPagoCtrl.generarPago = async (req, res) => {
  try {
    const { idTurno, obra_social, payer_email } = req.body;

    const descuentosObraSocial = {
      "OSDE": 0.3,
      "Swiss Medical": 0.25,
      "IOSFA": 0.2,
      "Otra": 0.1,
      "Particular": 0
    };

    const turno = await Turno.findById(idTurno);
    if (!turno) {
      return res.status(400).json({ msg: 'Turno no encontrado.' });
    }

    const precioBase = 5000;
    const descuento = descuentosObraSocial[obra_social] || 0;
    const precioFinal = parseFloat((precioBase * (1 - descuento)).toFixed(2));

    // ✅ Código actualizado para el body de la preferencia de pago
    const body = {
      payer_email, // Usamos el email real del pagador
      items: [{
        title: `Reserva de turno médico`,
        description: `Obra social: ${obra_social}`,
        quantity: 1,
        unit_price: precioFinal
      }],
      metadata: { // Añadimos los metadatos para incluir el idTurno
        idTurno: idTurno // Pasa el idTurno como metadato
      },
      back_urls: {
        success: "https://6dfa-2803-cf00-12fd-8600-b9da-2d5a-93d-db71.ngrok-free.app/pago/exitoso",
        failure: "https://6dfa-2803-cf00-12fd-8600-b9da-2d5a-93d-db71.ngrok-free.app/pago/fallido",
        pending: "https://6dfa-2803-cf00-12fd-8600-b9da-2d5a-93d-db71.ngrok-free.app/pago/pendiente"
      },
      auto_return: "approved"
    };

    const response = await axios.post('https://api.mercadopago.com/checkout/preferences', body, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ init_point: response.data.init_point });
  } catch (error) {
    console.error('❌ Error al generar el pago:', error.response?.data || error.message);
    res.status(500).json({ msg: 'Error al generar el pago avanzado' });
  }
};

module.exports = mercadoPagoCtrl;
