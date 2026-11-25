# Objeto dorsal — notas de diseño

## 01-landing · corrección de jerarquía (2026-11-25)

Tres defectos en el hero del artboard aprobado: (1) la fila CTA flotaba anclada al fondo de la columna editorial por `margin-top: auto`, divorciada del titular y el párrafo; (2) dos acciones primarias competían — el `Crear mi Dorsal` del nav en naranja ganaba el ojo frente al CTA real de subida en hueso; (3) la línea de privacidad quedaba bajo la placa del dorsal, en riesgo de quedar pintada por ella al ajustar el layout. El orden de lectura ahora es titular → párrafo → acción primaria → promesa de privacidad, todo en la columna izquierda; la placa solo muestra datos de ejemplo y ya no compite con texto real.

Reglas que esto establece para la implementación:

1. **Una sola primaria por pantalla.** La acción que inicia el flujo del producto (subir el CSV) debe ser la única con relleno de acento (`#fc5200`, texto tinta, sombra offset dura). Toda otra CTA — incluida la del nav — es fantasma: solo contorno, sin relleno. Si dos elementos llevan el color de acento, ninguno es percibido como primario.
2. **La CTA vive pegada a la copy que la justifica.** Nunca anclar acciones al fondo de la columna con `margin-top: auto`: quedan huérfanas del argumento que las precede y el ojo las busca en vano tras leer el párrafo.
3. **El objeto es decorativo; el texto nunca lo es.** Los elementos de lenguaje objeto (placas, pins, stickers) pintan sobre datos de ejemplo y nunca sobre compromisos reales del producto — la promesa de privacidad pertenece a la columna editorial, bajo el CTA, y ninguna placa puede solaparla. Regla operativa: tras cada cambio de layout, hit-test de cada rango de texto real contra el elemento superior en sus coordenadas; cero oclusiones.

Verificación: `impeccable detect` sin hallazgos de `text-occlusion` (solo `overused-font`, que es la pila Inter propia del proyecto); contraste del par CTA 5.23:1, texto fantasma y de privacidad ≥ 11.36:1; la placa conserva separación completa de la columna de texto; lienzo exacto 1440×900.
