// Usando fetch nativo de Node 22+
async function testRegister() {
    const payload = {
        folio: {
            tipo_movimiento: "ENTRADA",
            area_origen: "Ortopedia",
            id_usuario_registra: 1,
            observaciones_generales: "Test de depuración",
            estatus_folio: "ACTIVO"
        },
        detalle: {
            id_folio: 0,
            categoria: "EQUIPO",
            nombre_item: "Prueba Sistema",
            cantidad: 5
        }
    };

    try {
        const response = await fetch('http://localhost:5000/api/donaciones/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log("Response from server:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testRegister();
