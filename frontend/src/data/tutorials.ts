export interface Tutorial {
  title: string;
  subtitle: string;
  why: string;
  steps: string[];
  tips: string[];
  errorAvoid: string;
  icon: string;
}

export const TUTORIALS: Record<string, Tutorial> = {
  GERMINACION: {
    title: 'Desafío: Germinación',
    subtitle: 'Despertar a la Semilla',
    why: 'La germinación activa la vida dentro de la semilla. Buscamos darle la humedad, oscuridad y calor ideales para que la raíz principal (radícula) rompa el cascarón y comience a crecer.',
    steps: [
      'Coloca dos servilletas de papel absorbente de cocina sobre un plato.',
      'Humedece las servilletas con agua templada (no helada). Deben estar mojadas pero no chorreando agua.',
      'Coloca las semillas sobre la servilleta dejando espacio entre ellas.',
      'Cúbrelas con otras dos servilletas húmedas.',
      'Tapa el plato con otro plato dado vuelta para recrear oscuridad y retener la humedad (crea un efecto invernadero).',
      'Coloca el plato en un lugar cálido (entre 20°C y 25°C), por ejemplo, arriba de la heladera o dentro de un placard.',
      'Revisa cada 12-24 horas que las servilletas sigan húmedas. Agrega unas gotas de agua si se están secando.'
    ],
    tips: [
      'Usa agua purificada o reposada 24 horas para evitar el exceso de cloro.',
      'La paciencia es clave: algunas semillas tardan 24 horas y otras hasta 5 días en abrir.'
    ],
    errorAvoid: '¡No encharques el plato! El exceso de agua ahogará a la semilla impidiéndole respirar, lo que causará hongos que pudrirán la radícula.',
    icon: '🌱'
  },
  TRASPLANTE: {
    title: 'Desafío: El Trasplante',
    subtitle: 'Un Nuevo y Más Grande Hogar',
    why: 'A medida que las raíces crecen, colonizan todo el sustrato. Trasplantar a una maceta más grande les da nuevo espacio para expandirse, lo que se traduce directamente en un crecimiento más vigoroso de las ramas y hojas.',
    steps: [
      'Espera a que el sustrato de la maceta actual esté relativamente seco (hace que el pan de raíces salga entero y no se desarme).',
      'Prepara la nueva maceta llenando el fondo con sustrato nuevo y haz un hueco del tamaño de la maceta actual.',
      'Presiona suavemente los costados de la maceta pequeña para soltar el pan de raíces.',
      'Coloca tu mano en la superficie del sustrato, sosteniendo el tallo principal entre tus dedos, y gira la maceta boca abajo para deslizar el pan de raíces hacia afuera.',
      'Introduce el pan de raíces en el hueco de la nueva maceta. Intenta que el tallo quede enterrado hasta los cotiledones (las primeras hojitas redondas) para darle más estabilidad.',
      'Rellena los bordes con sustrato y presiona muy suavemente con los dedos.',
      'Realiza un riego abundante con agua pura para asentar el sustrato nuevo.'
    ],
    tips: [
      'Realiza el trasplante al final de la tarde o con las luces apagadas para evitar que el estrés lumínico afecte a las raíces expuestas.',
      'Usa micorrizas (hongos benéficos) espolvoreadas en el hueco del trasplante para potenciar el enraizado rápido.'
    ],
    errorAvoid: 'No aprietes demasiado fuerte el sustrato nuevo al rellenar. Las raíces necesitan aire para respirar y crecer; si compactas la tierra, les costará mucho avanzar.',
    icon: '🪴'
  },
  PODA: {
    title: 'Desafío: Poda Apical',
    subtitle: 'Multiplicando tus Flores',
    why: 'Al cortar la punta principal de la planta, rompemos la dominancia apical. Esto redistribuye las hormonas de crecimiento hacia las ramas laterales inferiores, transformando una sola punta principal en dos puntas grandes y un dosel mucho más homogéneo.',
    steps: [
      'Espera a que la planta tenga al menos 4 o 5 nudos (pisos de hojas) desarrollados.',
      'Desinfecta una tijera fina o bisturí con alcohol.',
      'Identifica el brote superior más nuevo en la punta de la planta.',
      'Realiza un corte limpio justo en la base del tallo del brote nuevo, justo por encima de las dos ramitas laterales del nudo inferior.',
      'Deja que la planta se recupere durante unos días con riego normal.'
    ],
    tips: [
      'Solo realiza podas si la planta se ve 100% saludable y verde. Una planta enferma detendrá su crecimiento.',
      'La poda apical no se recomienda en plantas autoflorecientes a menos que seas un cultivador avanzado, ya que su ciclo vegetativo es muy corto.'
    ],
    errorAvoid: 'Nunca cortes la punta principal antes del tercer nudo o si la planta es muy pequeña, ya que el estrés detendrá su desarrollo por completo.',
    icon: '✂️'
  },
  ENTRENAMIENTO: {
    title: 'Desafío: LST (Entrenamiento de Bajo Estrés)',
    subtitle: 'Guiando las Ramas hacia la Luz',
    why: 'El LST (Low Stress Training) consiste en doblar y atar las ramas más altas hacia abajo. Esto permite que la luz llegue de forma pareja a las ramas más bajas, estimulando que crezcan al mismo nivel y maximizando el espacio de cultivo.',
    steps: [
      'Consigue hilo suave, cable de jardinería engomado o clips (evita hilos de coser finos que puedan cortar el tallo).',
      'Dobla suavemente el tallo principal de la planta hacia un lado (idealmente a 90 grados).',
      'Ata el tallo usando un gancho o fijándolo al borde de la maceta para mantenerlo doblado.',
      'A medida que las ramas secundarias comiencen a crecer verticalmente buscando la luz, átalas también hacia afuera para abrir la estructura.',
      'Ajusta las ataduras cada pocos días según crezca la planta.'
    ],
    tips: [
      'Realiza el doblado cuando la planta necesite riego, ya que los tallos están más flexibles y menos turgentes, reduciendo el riesgo de quebrarse.',
      'Si por accidente quiebras un tallo, ponle cinta adhesiva rápido como un entablillado; se curará en una semana.'
    ],
    errorAvoid: '¡No uses demasiada fuerza! Si doblas de golpe un tallo leñoso y duro se quebrará. Hazlo de forma progresiva y con suavidad.',
    icon: '🕸️'
  },
  FERTILIZACION: {
    title: 'Desafío: Fertilización / Riego Nutricional',
    subtitle: 'Alimentando a tus Plantas',
    why: 'El sustrato se queda sin nutrientes en unas pocas semanas. La fertilización le aporta nitrógeno (para hojas y ramas en vegetativo), o fósforo y potasio (para engordar flores en floración), garantizando cosechas pesadas.',
    steps: [
      'Usa el fertilizante correspondiente a la etapa (Crecimiento o Floración).',
      'Mide la cantidad de agua que vas a utilizar en una botella limpia.',
      'Agita bien el fertilizante y dosifica utilizando una jeringa o vaso medidor (comienza siempre con la mitad de la dosis recomendada por el fabricante).',
      'Mezcla bien el fertilizante en el agua.',
      'Si tienes medidor, ajusta el pH (5.8-6.2 para coco, 6.2-6.6 para tierra).',
      'Riega la planta de forma homogénea alrededor del tallo principal.'
    ],
    tips: [
      'Menos es más: es extremadamente fácil sobrefertilizar una planta y muy difícil recuperarla. Siempre es preferible pecar de dar poco fertilizante que de dar de más.',
      'Realiza un riego de agua pura sola entre cada riego con fertilizante para evitar la acumulación de sales en las raíces.'
    ],
    errorAvoid: 'No apliques fertilizantes directamente sobre la tierra seca. Riega primero con un chorrito de agua sola para humedecer el sustrato y luego aplica el agua con nutrientes para evitar quemar los pelos radiculares.',
    icon: '🧪'
  },
  RIEGO: {
    title: 'Desafío: Riego de Agua',
    subtitle: 'El Arte de Hidratar',
    why: 'El agua transporta los nutrientes desde el suelo hacia las hojas. Las plantas de cannabis necesitan un ciclo de humedad y sequedad para que las raíces absorban agua y luego respiren oxígeno al secarse el sustrato.',
    steps: [
      'Comprueba que la maceta necesite riego metiendo un dedo en el sustrato (debe estar seco los primeros 3 cm) o levantando la maceta (si pesa poco, necesita agua).',
      'Prepara agua reposada 24 horas a temperatura ambiente.',
      'Riega despacio por toda la superficie, asegurándote de humedecer todo el sustrato por igual.',
      'Detente cuando veas salir las primeras gotas por los agujeros de drenaje del fondo.'
    ],
    tips: [
      'El peso de la maceta es el mejor indicador de riego. Levántala antes y después de regar para calibrar tu mano.',
      'Riega despacio para evitar que el agua cree canales y drene directo sin mojar la tierra.'
    ],
    errorAvoid: '¡No riegues todos los días! Mantener el sustrato constantemente empapado pudre las raíces por falta de oxígeno y atrae plagas de mosca del sustrato.',
    icon: '💧'
  },
  BITACORA: {
    title: 'Desafío: Registro en Bitácora',
    subtitle: 'El Diario del Cultivador',
    why: 'Registrar la altura de tus plantas, la temperatura y observaciones te permite detectar problemas a tiempo, aprender de cada ciclo y comparar el desarrollo de tus genéticas semana tras semana.',
    steps: [
      'Consigue una regla o cinta métrica.',
      'Mide la altura en centímetros desde la base del sustrato hasta la punta más alta de la planta.',
      'Cuenta los nudos (pisos de ramas) principales.',
      'Observa el color de las hojas (¿están verdes, amarillas en las puntas, tienen manchas?).',
      'Ingresa a la sección "Bitácora" de Cyclos y carga los datos de altura, nudos y notas de lo observado.'
    ],
    tips: [
      'Acompaña cada registro con una foto de la planta completa bajo la misma luz para ver el avance en tu galería histórica.',
      'Anota cualquier cambio que realices (ej: si hiciste una poda o cambiaste la altura del foco).'
    ],
    errorAvoid: 'No dejes pasar semanas sin registrar. Los cambios en el cannabis ocurren rápido y llevar un registro regular te ayudará a descifrar qué causó una deficiencia o un crecimiento explosivo.',
    icon: '📝'
  },
  COSECHA: {
    title: 'Desafío: La Cosecha y el Secado',
    subtitle: 'El Premio al Esfuerzo',
    why: 'El momento exacto del corte define el tipo de efecto (activo o relajante). El posterior secado lento evapora el agua de las flores de forma controlada para conservar los cannabinoides y el sabor a terpenos intactos.',
    steps: [
      'Observa los tricomas (las gotitas de resina sobre los cogollos) con una lupa. Deben estar en su mayoría de color blanco lechoso y algunos de color ámbar.',
      'Corta la planta desde la base del tallo principal.',
      'Realiza una manicura retirando las hojas grandes que no tengan resina.',
      'Cuelga la planta completa boca abajo o rama por rama en un lugar oscuro, ventilado pero sin corriente de aire directa.',
      'Mantén la temperatura entre 18°C y 22°C y la humedad en torno al 50-55%.',
      'Espera de 10 a 14 días. Estará lista cuando al doblar las ramas finas sientas un chasquido seco (crujido) en lugar de que se doblen de forma gomosa.'
    ],
    tips: [
      'Nunca seques tus cogollos al sol, al horno o con secador de pelo. Destruirás el THC y los sabores, dejando un humo rasposo con sabor a pasto seco.',
      'La oscuridad total durante el secado evita que la luz degrade la resina.'
    ],
    errorAvoid: 'No coseches antes de tiempo cuando todos los pelitos (pistilos) estén blancos. Espera a que al menos el 70-80% de los pelitos se tornen marrones y la resina se vuelva lechosa.',
    icon: '🪓'
  }
};
