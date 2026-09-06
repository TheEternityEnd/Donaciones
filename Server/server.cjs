const express = require('express');
const cors = require('cors');
const { query } = require('./index.cjs');

const app = express();

app.use(cors());
app.use(express.json());

// Consulta SQL Unificada para la tabla de donaciones y préstamos
const vistaSQL = `
    SELECT * FROM (
        SELECT 
            fm.id_folio AS "Folio",
            fm.fecha_registro AS "Fecha_Sistema",
            UPPER(fm.tipo_movimiento) AS "Operacion",
            fm.area_origen AS "Modulo",
            det.nombre_item AS "Articulo",
            det.categoria AS "Categoria",
            det.cantidad AS "Cant",
            COALESCE(cp.nombre_solicitante, '-') AS "Beneficiario",
            COALESCE(cp.telefono_solicitante, '-') AS "Contacto",
            cp.fecha_hora_devolucion_pactada AS "Vencimiento_Prestamo",
            COALESCE(UPPER(cp.estatus_prestamo), 'COMPLETADO') AS "Estado_Prestamo",
            fm.id_usuario_registra::text AS "Registrado_Por"
        FROM donaciones.folios_maestros fm
        JOIN donaciones.detalle_operaciones det ON fm.id_folio = det.id_folio
        LEFT JOIN donaciones.control_prestamos cp ON fm.id_folio = cp.id_folio
    ) AS vista_unificada
`;

app.get('/api/donaciones/historial', async (req, res) => {
    try {
        const { search } = req.query;
        let sql = `${vistaSQL}`;
        const params = [];

        if (search) {
            sql += ` WHERE "Folio"::TEXT = $1 OR "Beneficiario" ILIKE $2 OR "Articulo" ILIKE $2`;
            params.push(search, `%${search}%`);
        }
        
        sql += ' ORDER BY "Fecha_Sistema" DESC';

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error obteniendo historial:", error);
        res.status(500).json({ error: 'Error interno.' });
    }
});

app.get('/api/donaciones/prestamos/activos', async (req, res) => {
    try {
        const sql = `
            ${vistaSQL}
            WHERE "Operacion" = 'PRESTAMO' AND "Estado_Prestamo" = 'ACTIVO'
            ORDER BY "Fecha_Sistema" DESC
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error.' });
    }
});

app.get('/api/donaciones/prestamos/mora', async (req, res) => {
    try {
        const sql = `
            ${vistaSQL}
            WHERE "Operacion" = 'PRESTAMO' 
            AND "Estado_Prestamo" IN ('ACTIVO', 'MORA')
            AND "Vencimiento_Prestamo" < CURRENT_DATE
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error.' });
    }
});

// Mapeos reales
app.get('/api/donaciones/inventario', async (req, res) => {
    try {
        const sql = `
            SELECT 
                'Ortopedia' as category,
                nombre_articulo as name,
                categoria as subcategory,
                cantidad_disponible as stock,
                10 as minimum
            FROM ortopedia.inventario
            UNION ALL
            SELECT 
                'Farmacia' as category,
                nombre as name,
                tipo_medicamento as subcategory,
                0 as stock,
                stock_minimo as minimum
            FROM farmacia.medicamentos
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error.' });
    }
});

app.get('/api/donaciones/solicitudes', async (req, res) => {
    try {
        const sql = `
            ${vistaSQL}
            WHERE "Estado_Prestamo" = 'PENDIENTE'
            ORDER BY "Fecha_Sistema" DESC
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error.' });
    }
});

app.post('/api/donaciones/registrar', async (req, res) => {
    const { folio, detalle, prestamo } = req.body;
    const { pool } = require('./index.cjs');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Insertar en folios_maestros
        const fmQuery = `
            INSERT INTO donaciones.folios_maestros 
            (tipo_movimiento, area_origen, id_usuario_registra, observaciones_generales, estatus_folio)
            VALUES ($1, $2, $3, $4, $5) RETURNING id_folio;
        `;
        const fmValues = [
            folio.tipo_movimiento, 
            folio.area_origen || 'Farmacia', 
            folio.id_usuario_registra || 1, 
            folio.observaciones_generales || '', 
            folio.estatus_folio || 'true'
        ];
        const fmResult = await client.query(fmQuery, fmValues);
        const id_folio = fmResult.rows[0].id_folio;

        // 2. Insertar en detalle_operaciones
        const doQuery = `
            INSERT INTO donaciones.detalle_operaciones 
            (id_folio, categoria, id_item_externo, nombre_item, cantidad, lote_serie, estado_fisico_entrega)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;
        const doValues = [
            id_folio,
            detalle.categoria || 'MEDICAMENTO',
            detalle.id_item_externo || null,
            detalle.nombre_item || 'Desconocido',
            detalle.cantidad || 1,
            detalle.lote_serie || null,
            detalle.estado_fisico_entrega || null
        ];
        await client.query(doQuery, doValues);

        // 3. Insertar en control_prestamos si es PRESTAMO
        if (folio.tipo_movimiento === 'PRESTAMO' && prestamo) {
            const cpQuery = `
                INSERT INTO donaciones.control_prestamos 
                (id_folio, nombre_solicitante, telefono_solicitante, fecha_hora_devolucion_pactada, estatus_prestamo, compromiso_responsabilidad, notas_devolucion, id_usuario_entrega, id_usuario_recibe)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `;
            const cpValues = [
                id_folio,
                prestamo.nombre_solicitante || 'Sin Nombre',
                prestamo.telefono_solicitante || null,
                prestamo.fecha_hora_devolucion_pactada || null,
                prestamo.estatus_prestamo || 'ACTIVO',
                prestamo.compromiso_responsabilidad || false,
                prestamo.notas_devolucion || null,
                prestamo.id_usuario_entrega || 1,
                prestamo.id_usuario_recibe || null
            ];
            await client.query(cpQuery, cpValues);
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, id_folio: id_folio });
    } catch (error) {
        await client.query('ROLLBACK');
        console.log("DB ERROR DETAIL:", error.detail);
        console.error("DETAILED REGISTRATION ERROR:", error);
        res.status(500).json({ 
            success: false, 
            error: 'Database Error', 
            details: error.message,
            code: error.code
        });
    } finally {
        client.release();
    }
});

app.put('/api/donaciones/solicitudes/estado', async (req, res) => {
    try {
        const { id_folio, nuevo_estado } = req.body;
        const sql = `UPDATE ortopedia.prestamos SET estado_prestamo = $1 WHERE id_prestamo = $2 RETURNING *`;
        const result = await query(sql, [nuevo_estado, id_folio]);
        
        if (result.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.put('/api/donaciones/prestamos/devolucion', async (req, res) => {
    try {
        const { id_folio, notas } = req.body;
        const sql = `UPDATE ortopedia.prestamos SET estado_prestamo = 'DEVUELTO', observaciones = $1 WHERE id_prestamo = $2 RETURNING *`;
        const result = await query(sql, [notas || null, id_folio]);
        
        if (result.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor Backend corriendo en puerto ${PORT}`));
