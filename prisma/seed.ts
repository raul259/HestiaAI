import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const property = await prisma.property.upsert({
    where: { id: "demo" },
    update: {},
    create: {
      id: "demo",
      hostId: "demo-host",
      name: "Villa Mediterránea",
      address: "Calle del Mar, 14, 07001 Palma de Mallorca",
      description:
        "Precioso apartamento a 200m de la playa con vistas al mar. Capacidad para 4 personas.",
      wifiName: "VillaMed_5G",
      wifiPassword: "Mallorca2024!",
      checkoutInstructions:
        "1. Lavar y guardar los platos utilizados.\n2. Dejar las toallas en el cuarto de baño.\n3. Cerrar todas las ventanas y persianas.\n4. Apagar todas las luces y el aire acondicionado.\n5. Dejar las llaves dentro de la caja de seguridad exterior (código: 1234).\n6. El check-out es antes de las 11:00h.",
      wasteInstructions:
        "Contenedor amarillo (plástico/latas): Calle del Mar esquina con Calle Sol.\nContenedor azul (papel/cartón): Plaza Mayor, 2.\nContenedor verde (vidrio): Junto a la farmacia.\nResto de basura: Contenedor gris en el portal (vaciado cada noche entre 22:00-23:00h).",
      emergencyContact:
        "Carlos (anfitrión): +34 612 345 678 — Disponible 9:00-21:00h.\nEmergencias 24h: +34 623 456 789.\nFontanero de guardia: Fontanería Rápida +34 634 567 890.",
      hostName: "Carlos Martínez",
      hostEmail: "carlos@villamediterranea.com",
      accessCode: "1234",
    },
  });

  console.log(`Created property: ${property.name} (ID: ${property.id})`);

  const appliances = [
    {
      propertyId: "demo",
      name: "Aire Acondicionado",
      model: "Daikin FTXM35R",
      category: "ac",
      location: "Salón y dormitorio principal",
      manual: `MANUAL DE USO - AIRE ACONDICIONADO DAIKIN FTXM35R

ENCENDIDO/APAGADO:
- Presiona el botón ON/OFF (rojo) del mando a distancia.

MODOS DE FUNCIONAMIENTO:
- AUTO (símbolo A): Ajusta automáticamente frío o calor.
- FRÍO (copo de nieve): Para refrigerar. Temperatura recomendada: 24-26°C.
- CALOR (sol): Para calentar. Temperatura recomendada: 20-22°C.
- VENTILADOR (ventilador): Solo circula el aire, sin frío ni calor.
- SECO (gota): Deshumidifica el ambiente.

AJUSTE DE TEMPERATURA:
- Botones ▲▼ del mando para subir/bajar temperatura de 1 en 1 grado.

VELOCIDAD DEL VENTILADOR:
- Botón FAN SPEED: Cambia entre Auto, Bajo, Medio, Alto, Máximo.

TEMPORIZADOR:
- Botón TIMER: Programa apagado automático. Presiona hasta seleccionar las horas (1-24h).

SOLUCIÓN DE PROBLEMAS:
- Parpadea luz verde: El aparato está en modo de inicio. Espera 3 minutos.
- No enfría bien: Comprueba que las ventanas y puertas están cerradas. Limpia el filtro (cada 2 semanas): abre la tapa frontal y extrae el filtro, lávalo con agua fría.
- Mando no funciona: Comprueba las pilas (tipo AAA x2). Apunta el mando directamente al receptor frontal del aparato.`,
    },
    {
      propertyId: "demo",
      name: "Smart TV",
      model: "Samsung The Frame 55 QE55LS03B",
      category: "tv",
      location: "Salón",
      manual: `MANUAL DE USO - SMART TV SAMSUNG 55"

ENCENDIDO:
- Mando a distancia: Botón de encendido (círculo con línea vertical).
- Si no responde el mando, usa el botón táctil en el borde inferior derecho de la TV.

CAMBIAR DE ENTRADA:
- Presiona HOME en el mando → Fuentes → Selecciona la que necesites (HDMI 1, HDMI 2, etc.)

NETFLIX/YOUTUBE/PRIME VIDEO:
- Acceso directo con los botones de colores del mando (Netflix=rojo, Prime=azul).
- O presiona HOME y selecciona la app.

CONFIGURACIÓN DE WIFI:
- HOME → Configuración (engranaje) → General → Red → Configuración de red → Inalámbrica → Selecciona red.

CONTROL DE VOLUMEN:
- Rueda lateral del mando o botones + / - en el control remoto estándar.

MODO ARTE (The Frame):
- HOME → Modo Arte: Muestra cuadros cuando no está en uso. Apagar modo arte en Configuración → Modo Arte → Desactivar detección de movimiento.

PROBLEMAS COMUNES:
- Pantalla en negro pero la TV está encendida: Presiona SOURCE/FUENTES y selecciona TV o la entrada correcta.
- Sin sonido: Comprueba que el volumen no esté a 0 y que no esté en silencio (botón X en el mando).
- La app no carga: HOME → Configuración → Soporte → Diagnóstico → Reiniciar Smart Hub.`,
    },
    {
      propertyId: "demo",
      name: "Lavadora",
      model: "LG F4WV3010S6W",
      category: "washer",
      location: "Cuarto de lavandería (pasillo)",
      manual: `MANUAL DE USO - LAVADORA LG F4WV3010S6W

PRIMEROS PASOS:
1. Carga la ropa sin superar la línea MAX del tambor.
2. Añade detergente en el cajón: compartimento II para lavado, compartimento * para suavizante.
3. Cierra la puerta hasta escuchar un "clic".

PROGRAMAS PRINCIPALES:
- COTÓN 40°C: Ropa de algodón normal. Duración: ~2h.
- COTÓN 60°C: Ropa blanca o muy sucia. Duración: ~2h 30min.
- SINTÉTICOS 30°C: Ropa delicada y sintéticos. Duración: ~1h.
- RÁPIDO 15': Pocas prendas ligeramente sucias. Solo disponible con poca carga.
- LANA/DELICADOS: Para lana y prendas delicadas. Agua fría.
- CENTRIFUGADO + ESCURRIDO: Solo para escurrir ropa ya lavada.

OPCIONES ADICIONALES:
- TEMPERATURA: Ajusta con el botón TEMP.
- CENTRIFUGADO: Ajusta RPM con el botón SPIN. Para ropa delicada, baja a 800RPM.
- VAPOR: Desinfecta y elimina arrugas.

INICIAR:
- Selecciona programa con el selector giratorio → Presiona START/PAUSE.

SOLUCIÓN DE PROBLEMAS:
- Error UE: Carga desequilibrada. Redistribuye la ropa y presiona START/PAUSE.
- Error OE: Problema de desagüe. Comprueba que la manguera no esté doblada.
- La puerta no abre: Espera 2 minutos tras terminar. Si persiste, usa el asa de emergencia (tirador naranja en la parte inferior derecha).
- No centrifuga bien: Reduce RPM o redistribuye la carga.`,
    },
    {
      propertyId: "demo",
      name: "Vitrocerámica",
      model: "Bosch PXE801DC1E",
      category: "oven",
      location: "Cocina",
      manual: `MANUAL DE USO - VITROCERÁMICA BOSCH PXE801DC1E (Inducción)

IMPORTANTE: Es una vitrocerámica de INDUCCIÓN. Solo funciona con utensilios magnéticos (acero inoxidable, hierro fundido). Prueba acercando un imán al fondo de la olla: si se pega, es compatible.

ENCENDIDO:
- Toca el símbolo ON/OFF (línea vertical) durante 2 segundos.

ZONAS DE COCCIÓN:
- La placa tiene 4 zonas. Cada una se controla independientemente.
- Toca la zona que quieres usar → aparece un número en el panel.
- Ajusta potencia con + / - (0=apagado, 1-9=niveles de calor).

NIVELES RECOMENDADOS:
- 1-2: Mantener caliente, fundir chocolate.
- 3-4: Cocción lenta, guisos.
- 5-6: Cocción media, arroces, salsas.
- 7-8: Freír, sellar carne.
- 9: Máxima potencia, hervir agua rápido.

FUNCIÓN BOOSTER (P):
- Máxima potencia para hervir agua rápidamente. Presiona el botón "P".

TEMPORIZADOR:
- Presiona el símbolo de reloj → selecciona zona → ajusta minutos.

BLOQUEO DE TECLAS (niños):
- Mantén presionado el símbolo de candado 3 segundos.

APAGADO AUTOMÁTICO:
- Si dejas la placa encendida sin actividad, se apaga sola por seguridad.

SOLUCIÓN DE PROBLEMAS:
- No funciona con mi olla: Comprueba compatibilidad con imán. Las ollas de aluminio no funcionan.
- Error F: Apaga y vuelve a encender. Si persiste, espera 10 minutos.
- Marcas blancas: Limpia con producto específico para vitrocerámica cuando esté fría.`,
    },
    {
      propertyId: "demo",
      name: "Router WiFi",
      model: "ASUS RT-AX88U",
      category: "wifi",
      location: "Salón, junto al TV",
      manual: `INFORMACIÓN DE CONECTIVIDAD - ROUTER ASUS RT-AX88U

RED WiFi:
- Nombre red (SSID): VillaMed_5G
- Contraseña: Mallorca2024!
- Red alternativa (2.4GHz, más rango): VillaMed_2G / misma contraseña.

VELOCIDAD CONTRATADA: 600 Mbps simétricos (fibra óptica).

REINICIO DEL ROUTER (si hay problemas de conexión):
1. Desenchufa el adaptador de corriente del router (caja negra junto al TV).
2. Espera 30 segundos contando.
3. Vuelve a enchufarlo.
4. Espera 2 minutos hasta que las luces se estabilicen (deben ser: azul fijo = correcto).

LUCES DE ESTADO:
- Luz azul fija: Todo correcto.
- Luz parpadeante rápido: Iniciando. Espera.
- Luz roja: Sin conexión a internet. Reinicia el router.

SOLUCIÓN DE PROBLEMAS:
- WiFi lento: Conecta a VillaMed_5G si estás cerca del router. Usa VillaMed_2G si estás lejos.
- No puedo conectarme: Olvida la red en tu dispositivo y vuelve a conectarla con la contraseña.
- Sin internet tras reinicio: Espera 5 minutos. Si persiste, el problema puede ser de la operadora (llama al anfitrión).
- Dónde está el router: En el salón, junto a la TV, es la caja negra con antenas.`,
    },
  ];

  for (const appliance of appliances) {
    await prisma.appliance.upsert({
      where: {
        id: `demo-${appliance.category}`,
      },
      update: {
        manual: appliance.manual,
      },
      create: {
        id: `demo-${appliance.category}`,
        ...appliance,
      },
    });
    console.log(`Created appliance: ${appliance.name}`);
  }

  const sampleIncident = await prisma.incident.upsert({
    where: { id: "demo-incident-1" },
    update: {},
    create: {
      id: "demo-incident-1",
      propertyId: "demo",
      title: "Aire acondicionado no enfría correctamente",
      description:
        "El huésped reporta que el aire acondicionado del salón no consigue bajar de 28°C a pesar de estar configurado a 22°C.",
      category: "appliance",
      status: "open",
      priority: "medium",
      guestName: "María González",
      guestEmail: "maria.gonzalez@email.com",
    },
  });

  console.log(`Created sample incident: ${sampleIncident.title}`);
  console.log("\nSeed completed successfully!");
  console.log(
    `\nGuest portal URL: http://localhost:3000/guest/${property.id}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
