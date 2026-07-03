import fs from 'fs';
import path from 'path';

async function diagnose() {
  console.log('=== INICIO DIAGNÓSTICO DE ALMACENAMIENTO ===');
  console.log('Directorio de trabajo actual:', process.cwd());
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('UPLOADS_DIR:', process.env.UPLOADS_DIR);

  // Asegurar que existan y persistan los directorios necesarios para la app antes de los tests
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('file:')) {
    const dbPath = dbUrl.replace(/^file:/, '');
    const dbDir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Directorio de base de datos creado: ${dbDir}`);
      } catch (err: any) {
        console.log(`Error al crear el directorio de base de datos ${dbDir}:`, err.message);
      }
    }
  }

  const envUploadsDir = process.env.UPLOADS_DIR;
  if (envUploadsDir) {
    const absUploads = path.resolve(envUploadsDir);
    if (!fs.existsSync(absUploads)) {
      try {
        fs.mkdirSync(absUploads, { recursive: true });
        console.log(`Directorio de subidas (uploads) creado: ${absUploads}`);
      } catch (err: any) {
        console.log(`Error al crear el directorio de subidas ${absUploads}:`, err.message);
      }
    }
  }

  // Ver carpetas y verificar permisos
  const pathsToCheck = ['/data', '/data/db', '/data/database', './prisma'];
  for (const p of pathsToCheck) {
    const absPath = path.resolve(p);
    console.log(`Verificando ruta: ${absPath}`);
    try {
      if (fs.existsSync(absPath)) {
        const stats = fs.statSync(absPath);
        console.log(`  Existe. stats: uid=${stats.uid}, gid=${stats.gid}, mode=${stats.mode.toString(8)}`);
        // Probar escritura
        const testFile = path.join(absPath, '.write-test-' + Date.now());
        try {
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          console.log(`  ¡Escritura en ${absPath} EXITOSA!`);
        } catch (wErr: any) {
          console.log(`  Fallo al escribir en ${absPath}:`, wErr.message);
        }
      } else {
        console.log(`  No existe.`);
        // Intentar crearla
        try {
          fs.mkdirSync(absPath, { recursive: true });
          console.log(`  ¡Creación de carpeta ${absPath} EXITOSA!`);
          
          // No borrarla si es necesaria para la base de datos o subidas
          const isDbDir = dbUrl && dbUrl.startsWith('file:') && path.dirname(path.resolve(dbUrl.replace(/^file:/, ''))).startsWith(absPath);
          const isUploadsDir = envUploadsDir && path.resolve(envUploadsDir).startsWith(absPath);
          
          if (!isDbDir && !isUploadsDir) {
            fs.rmdirSync(absPath);
            console.log(`  Carpeta de test ${absPath} eliminada.`);
          } else {
            console.log(`  Manteniendo carpeta creada ${absPath} ya que es requerida por la aplicación.`);
          }
        } catch (cErr: any) {
          console.log(`  Fallo al crear carpeta ${absPath}:`, cErr.message);
        }
      }
    } catch (err: any) {
      console.log(`  Error leyendo stats de ${absPath}:`, err.message);
    }
  }

  // Leer /proc/mounts para ver dónde está el disco persistente montado realmente
  try {
    if (fs.existsSync('/proc/mounts')) {
      const mounts = fs.readFileSync('/proc/mounts', 'utf-8');
      console.log('Puntos de montaje activos (filtrados por render/data):');
      mounts.split('\n').forEach(line => {
        if (line.includes('data') || line.includes('project') || line.includes('opt')) {
          console.log(`  ${line}`);
        }
      });
    }
  } catch (err: any) {
    console.log('No se pudieron leer los puntos de montaje:', err.message);
  }

  console.log('=== FIN DIAGNÓSTICO DE ALMACENAMIENTO ===');
}

diagnose().catch(err => console.error('Error en diagnóstico:', err));
