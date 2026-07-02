import fs from 'fs';
import path from 'path';

async function diagnose() {
  console.log('=== INICIO DIAGNÓSTICO DE ALMACENAMIENTO ===');
  console.log('Directorio de trabajo actual:', process.cwd());
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('UPLOADS_DIR:', process.env.UPLOADS_DIR);

  // Ver carpetas y permisos
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
          fs.rmdirSync(absPath);
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
