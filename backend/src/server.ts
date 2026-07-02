import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads folder exists in backend root
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Test Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date(), database: 'Prisma Client Initialized' });
});

/* ==========================================================
   USER ENDPOINTS
   ========================================================== */

// GET user by email
app.get('/api/users/by-email/:email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params;
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    
    // Auto-create default user if it's the default email and database is empty of it
    if (!user && email.toLowerCase().trim() === 'grower@cannatrack.pro') {
      const defaultId = await getOrCreateUserId();
      user = await prisma.user.findUnique({
        where: { id: defaultId }
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    next(error);
  }
});

// POST create/sync user
app.post('/api/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, email, name } = req.body;
    
    // Check if user already exists by ID or Email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { email: email.toLowerCase().trim() }
        ]
      }
    });

    if (existing) {
      return res.json({ id: existing.id, email: existing.email, name: existing.name });
    }

    const newUser = await prisma.user.create({
      data: {
        id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: 'pbkdf2_hashed_mock_password'
      }
    });

    res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   AUTH ENDPOINTS
   ========================================================== */

// POST register
app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: passwordHash
      }
    });

    res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name });
  } catch (error) {
    next(error);
  }
});

// POST login
app.post('/api/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (!user) {
      return res.status(401).json({ error: 'No existe una cuenta con ese email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   IMAGE UPLOAD ENDPOINT
   ========================================================== */

// POST upload photo
app.post('/api/upload', upload.single('photo'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }
    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir la imagen.' });
  }
});

/* ==========================================================
   GROW ROUTES
   ========================================================== */

// GET all grows
app.get('/api/grows', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Falta el parámetro userId.' });
    }
    const grows = await prisma.grow.findMany({
      where: { userId: String(userId) },
      include: {
        tasks: true,
        dailyLogs: { orderBy: { date: 'desc' } },
        waterings: { orderBy: { date: 'desc' } },
        fertilizers: { orderBy: { date: 'desc' } },
        harvest: true
      },
      orderBy: { startDate: 'desc' }
    });
    res.json(grows);
  } catch (error) {
    next(error);
  }
});

// GET grow by ID
app.get('/api/grows/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grow = await prisma.grow.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: { orderBy: { dueDate: 'asc' } },
        dailyLogs: { orderBy: { date: 'asc' } },
        waterings: { orderBy: { date: 'desc' } },
        fertilizers: { orderBy: { date: 'desc' } },
        harvest: true
      }
    });
    if (!grow) {
      return res.status(404).json({ error: 'Grow not found' });
    }
    res.json(grow);
  } catch (error) {
    next(error);
  }
});

// CREATE a new grow
app.post('/api/grows', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name, genetics, seedBank, photoperiod, startDate, medium,
      fertilizerType, indoor, plantCount, potSizeInitial, potSizeIntermediate,
      potSizeFinal, lightPowerWatts, surfaceAreaSqm, vegWeeksPlanned,
      flowerWeeksPlanned, tasks, userId,
      spaceId, wateringMode, wateringFreqDays, fertFreqDays, avgTemp, avgHumidity, logReminderFreq, logDayOfWeek,
      fertDayOfWeek, lastWateringDate, experienceLevel
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Falta el parámetro userId.' });
    }
    await ensureUserExists(userId);

    const newGrow = await prisma.grow.create({
      data: {
        userId: userId,
        name,
        genetics,
        seedBank,
        photoperiod,
        startDate: new Date(startDate),
        status: 'VEGETATIVO',
        medium,
        fertilizerType,
        indoor,
        plantCount: Number(plantCount),
        potSizeInitial: Number(potSizeInitial),
        potSizeIntermediate: potSizeIntermediate ? Number(potSizeIntermediate) : null,
        potSizeFinal: Number(potSizeFinal),
        lightPowerWatts: Number(lightPowerWatts),
        surfaceAreaSqm: Number(surfaceAreaSqm),
        vegWeeksPlanned: Number(vegWeeksPlanned),
        flowerWeeksPlanned: Number(flowerWeeksPlanned),
        spaceId: spaceId || null,
        wateringMode: wateringMode || null,
        wateringFreqDays: wateringFreqDays ? Number(wateringFreqDays) : null,
        fertFreqDays: fertFreqDays ? Number(fertFreqDays) : null,
        avgTemp: avgTemp ? Number(avgTemp) : null,
        avgHumidity: avgHumidity ? Number(avgHumidity) : null,
        logReminderFreq: logReminderFreq || null,
        logDayOfWeek: (logDayOfWeek !== undefined && logDayOfWeek !== null && logDayOfWeek !== '') ? Number(logDayOfWeek) : null,
        fertDayOfWeek: (fertDayOfWeek !== undefined && fertDayOfWeek !== null && fertDayOfWeek !== '') ? Number(fertDayOfWeek) : null,
        lastWateringDate: lastWateringDate ? new Date(lastWateringDate) : null,
        experienceLevel: experienceLevel || 'NORMAL',
        tasks: {
          create: tasks ? tasks.map((task: any) => ({
            title: task.title,
            category: task.category,
            dueDate: new Date(task.dueDate),
            completed: task.completed || false,
            completedAt: task.completedAt ? new Date(task.completedAt) : null
          })) : []
        }
      },
      include: {
        tasks: true
      }
    });

    res.status(201).json(newGrow);
  } catch (error) {
    next(error);
  }
});

// UPDATE grow details
app.put('/api/grows/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      status, name, genetics, seedBank, potSizeFinal,
      spaceId, wateringMode, wateringFreqDays, fertFreqDays, avgTemp, avgHumidity, logReminderFreq, logDayOfWeek,
      fertDayOfWeek, lastWateringDate, startDate, experienceLevel
    } = req.body;

    // Shift tasks if startDate changes
    if (startDate) {
      const oldGrow = await prisma.grow.findUnique({
        where: { id: req.params.id },
        include: { tasks: true }
      });
      if (oldGrow) {
        const oldStart = new Date(oldGrow.startDate);
        const newStart = new Date(startDate);
        const diffTime = newStart.getTime() - oldStart.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays !== 0) {
          for (const task of oldGrow.tasks) {
            const oldDue = new Date(task.dueDate);
            const newDue = new Date(oldDue.getTime() + diffDays * 86400000);
            await prisma.task.update({
              where: { id: task.id },
              data: { dueDate: newDue }
            });
          }
        }
      }
    }

    const updatedGrow = await prisma.grow.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(genetics && { genetics }),
        ...(seedBank && { seedBank }),
        ...(potSizeFinal && { potSizeFinal: Number(potSizeFinal) }),
        ...(spaceId !== undefined && { spaceId: spaceId || null }),
        ...(wateringMode !== undefined && { wateringMode }),
        ...(wateringFreqDays !== undefined && { wateringFreqDays: wateringFreqDays ? Number(wateringFreqDays) : null }),
        ...(fertFreqDays !== undefined && { fertFreqDays: fertFreqDays ? Number(fertFreqDays) : null }),
        ...(avgTemp !== undefined && { avgTemp: avgTemp ? Number(avgTemp) : null }),
        ...(avgHumidity !== undefined && { avgHumidity: avgHumidity ? Number(avgHumidity) : null }),
        ...(logReminderFreq !== undefined && { logReminderFreq }),
        ...(logDayOfWeek !== undefined && { logDayOfWeek: (logDayOfWeek !== null && logDayOfWeek !== '') ? Number(logDayOfWeek) : null }),
        ...(fertDayOfWeek !== undefined && { fertDayOfWeek: (fertDayOfWeek !== null && fertDayOfWeek !== '') ? Number(fertDayOfWeek) : null }),
        ...(lastWateringDate !== undefined && { lastWateringDate: lastWateringDate ? new Date(lastWateringDate) : null }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(experienceLevel !== undefined && { experienceLevel })
      }
    });
    res.json(updatedGrow);
  } catch (error) {
    next(error);
  }
});

// DELETE a grow
app.delete('/api/grows/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.grow.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Grow deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   DAILY LOGS ROUTES
   ========================================================== */

// POST a daily log
app.post('/api/grows/:growId/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, heightCm, nodes, tempMin, tempMax, humidityMin, humidityMax, ph, ec, notes, photoUrl } = req.body;
    const newLog = await prisma.dailyLog.create({
      data: {
        growId: req.params.growId,
        date: new Date(date),
        heightCm: heightCm ? Number(heightCm) : null,
        nodes: nodes ? Number(nodes) : null,
        tempMin: tempMin ? Number(tempMin) : null,
        tempMax: tempMax ? Number(tempMax) : null,
        humidityMin: humidityMin ? Number(humidityMin) : null,
        humidityMax: humidityMax ? Number(humidityMax) : null,
        ph: ph ? Number(ph) : null,
        ec: ec ? Number(ec) : null,
        notes,
        photoUrl
      }
    });
    res.status(201).json(newLog);
  } catch (error) {
    next(error);
  }
});

// DELETE a daily log
app.delete('/api/logs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.dailyLog.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   WATERING LOGS ROUTES
   ========================================================== */

// POST watering event
app.post('/api/grows/:growId/waterings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, volumeLiters, ph, ec, additives } = req.body;
    const wateringDate = new Date(date);
    const newWatering = await prisma.wateringLog.create({
      data: {
        growId: req.params.growId,
        date: wateringDate,
        volumeLiters: Number(volumeLiters),
        ph: ph ? Number(ph) : null,
        ec: ec ? Number(ec) : null,
        additives
      }
    });

    // Update the grow's lastWateringDate if the new watering is newer
    const grow = await prisma.grow.findUnique({
      where: { id: req.params.growId }
    });
    if (grow) {
      if (!grow.lastWateringDate || wateringDate >= grow.lastWateringDate) {
        await prisma.grow.update({
          where: { id: req.params.growId },
          data: { lastWateringDate: wateringDate }
        });
      }
    }

    res.status(201).json(newWatering);
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   FERTILIZER LOGS ROUTES
   ========================================================== */

// POST fertilizer log
app.post('/api/grows/:growId/fertilizers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, productName, dosageMlPerL, frequencyDays, notes } = req.body;
    const newFertilizer = await prisma.fertilizerLog.create({
      data: {
        growId: req.params.growId,
        date: new Date(date),
        productName,
        dosageMlPerL: Number(dosageMlPerL),
        frequencyDays: frequencyDays ? Number(frequencyDays) : null,
        notes
      }
    });
    res.status(201).json(newFertilizer);
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   TASK ROUTES
   ========================================================== */

// PUT update a task (toggle complete)
app.put('/api/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { completed, dueDate } = req.body;
    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(completed !== undefined && { completed, completedAt: completed ? new Date() : null }),
        ...(dueDate && { dueDate: new Date(dueDate) })
      }
    });
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
});

// POST custom task for a grow
app.post('/api/grows/:growId/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, category, dueDate, notes } = req.body;
    const newTask = await prisma.task.create({
      data: {
        growId: req.params.growId,
        title,
        category,
        dueDate: new Date(dueDate),
        completed: false
      }
    });
    res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
});

// DELETE a task
app.delete('/api/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   HARVEST RECORD ROUTES
   ========================================================== */

// POST harvest record (finishing a grow)
app.post('/api/grows/:growId/harvest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { harvestDate, wetWeightGrams, dryWeightGrams, cureStartDate, cureEndDate, potencyRating, terpenesNotes, generalNotes } = req.body;
    
    // Begin transaction: Create harvest record and update grow status to 'COSECHADO'
    const result = await prisma.$transaction([
      prisma.harvestRecord.create({
        data: {
          growId: req.params.growId,
          harvestDate: new Date(harvestDate),
          wetWeightGrams: wetWeightGrams ? Number(wetWeightGrams) : null,
          dryWeightGrams: Number(dryWeightGrams),
          cureStartDate: cureStartDate ? new Date(cureStartDate) : null,
          cureEndDate: cureEndDate ? new Date(cureEndDate) : null,
          potencyRating: potencyRating ? Number(potencyRating) : null,
          terpenesNotes,
          generalNotes
        }
      }),
      prisma.grow.update({
        where: { id: req.params.growId },
        data: { status: 'COSECHADO' }
      })
    ]);

    res.status(201).json(result[0]);
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   MOTHER & CLONES ROUTES
   ========================================================== */

// GET mothers
app.get('/api/mothers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Falta el parámetro userId.' });
    }
    const mothers = await prisma.motherPlant.findMany({
      where: { userId: String(userId) },
      include: { clones: true },
      orderBy: { startDate: 'desc' }
    });
    res.json(mothers);
  } catch (error) {
    next(error);
  }
});

// POST mother
app.post('/api/mothers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, genetics, seedBank, startDate, notes, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Falta el parámetro userId.' });
    }
    await ensureUserExists(userId);
    const mother = await prisma.motherPlant.create({
      data: {
        userId,
        name,
        genetics,
        seedBank,
        startDate: new Date(startDate),
        status: 'ACTIVA',
        notes
      }
    });
    res.status(201).json(mother);
  } catch (error) {
    next(error);
  }
});

// GET clones
app.get('/api/clones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Falta el parámetro userId.' });
    }
    const clones = await prisma.cloneBatch.findMany({
      where: { userId: String(userId) },
      include: { motherPlant: true },
      orderBy: { cutDate: 'desc' }
    });
    res.json(clones);
  } catch (error) {
    next(error);
  }
});

// POST clone batch
app.post('/api/clones', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, motherPlantId, cutDate, rootedDate, quantityCut, quantityRooted, status, notes, avgTemp, avgHumidity, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Falta el parámetro userId.' });
    }
    await ensureUserExists(userId);
    
    let successRate = null;
    if (quantityCut && quantityRooted) {
      successRate = (Number(quantityRooted) / Number(quantityCut)) * 100;
    }

    const clones = await prisma.cloneBatch.create({
      data: {
        userId: userId,
        motherPlantId: motherPlantId || null,
        name,
        cutDate: new Date(cutDate),
        rootedDate: rootedDate ? new Date(rootedDate) : null,
        quantityCut: Number(quantityCut),
        quantityRooted: quantityRooted ? Number(quantityRooted) : null,
        successRate,
        status: status || 'ENRAIZANDO',
        notes,
        avgTemp: avgTemp ? Number(avgTemp) : null,
        avgHumidity: avgHumidity ? Number(avgHumidity) : null
      }
    });
    res.status(201).json(clones);
  } catch (error) {
    next(error);
  }
});

// PUT update clone batch
app.put('/api/clones/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, status, quantityCut, quantityRooted, rootedDate, notes, avgTemp, avgHumidity } = req.body;
    
    const current = await prisma.cloneBatch.findUnique({
      where: { id: req.params.id }
    });
    if (!current) {
      return res.status(404).json({ error: 'Clone batch not found' });
    }

    const finalQtyCut = quantityCut !== undefined ? Number(quantityCut) : current.quantityCut;
    const finalQtyRooted = quantityRooted !== undefined 
      ? (quantityRooted !== null ? Number(quantityRooted) : null) 
      : current.quantityRooted;

    let successRate = null;
    if (finalQtyCut && finalQtyRooted !== null) {
      successRate = (finalQtyRooted / finalQtyCut) * 100;
    }

    const updated = await prisma.cloneBatch.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        ...(quantityCut !== undefined && { quantityCut: Number(quantityCut) }),
        ...(quantityRooted !== undefined && { quantityRooted: quantityRooted !== null ? Number(quantityRooted) : null }),
        ...(rootedDate !== undefined && { rootedDate: rootedDate ? new Date(rootedDate) : null }),
        ...(notes !== undefined && { notes }),
        ...(avgTemp !== undefined && { avgTemp: avgTemp !== null ? Number(avgTemp) : null }),
        ...(avgHumidity !== undefined && { avgHumidity: avgHumidity !== null ? Number(avgHumidity) : null }),
        successRate
      }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   TEMPLATES ROUTES
   ========================================================== */

// GET templates
app.get('/api/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.template.findMany();
    const formatted = templates.map(t => {
      try {
        return {
          ...t,
          suggestedPrunings: JSON.parse(t.suggestedPrunings)
        };
      } catch {
        return {
          ...t,
          suggestedPrunings: t.suggestedPrunings ? t.suggestedPrunings.split(',') : []
        };
      }
    });
    res.json(formatted);
  } catch (error) {
    next(error);
  }
});

// POST template
app.post('/api/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, vegWeeks, flowerWeeks, photoperiod, medium, fertilizerType, wateringFreqDays, suggestedPrunings } = req.body;
    const template = await prisma.template.create({
      data: {
        name,
        description,
        vegWeeks: Number(vegWeeks),
        flowerWeeks: Number(flowerWeeks),
        photoperiod: Boolean(photoperiod),
        medium,
        fertilizerType,
        wateringFreqDays: Number(wateringFreqDays),
        suggestedPrunings: JSON.stringify(suggestedPrunings || []),
        isCustom: true
      }
    });
    
    res.status(201).json({
      ...template,
      suggestedPrunings: suggestedPrunings || []
    });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   SPACES ROUTES
   ========================================================== */

// GET all spaces
app.get('/api/spaces', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Falta el parámetro userId.' });
    }
    const spaces = await prisma.space.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(spaces);
  } catch (error) {
    next(error);
  }
});

// POST a new space
app.post('/api/spaces', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, surfaceAreaSqm, lightPowerWatts, maxPots, setup, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Falta el parámetro userId.' });
    }
    await ensureUserExists(userId);

    const area = Number(surfaceAreaSqm);
    const finalSetup = setup || 'carpa';
    if (finalSetup === 'sala' && area > 25) {
      return res.status(400).json({ error: 'La superficie máxima para una sala de cultivo es de 25 metros cuadrados.' });
    }

    const space = await prisma.space.create({
      data: {
        userId: userId,
        name,
        type,
        surfaceAreaSqm: area,
        lightPowerWatts: Number(lightPowerWatts),
        maxPots: Number(maxPots),
        setup: finalSetup
      }
    });
    res.status(201).json(space);
  } catch (error) {
    next(error);
  }
});

// PUT update space
app.put('/api/spaces/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, surfaceAreaSqm, lightPowerWatts, maxPots, setup } = req.body;
    
    const current = await prisma.space.findUnique({
      where: { id: req.params.id }
    });
    if (!current) {
      return res.status(404).json({ error: 'Space not found' });
    }

    const finalSetup = setup !== undefined ? setup : current.setup;
    const finalArea = surfaceAreaSqm !== undefined ? Number(surfaceAreaSqm) : current.surfaceAreaSqm;

    if (finalSetup === 'sala' && finalArea > 25) {
      return res.status(400).json({ error: 'La superficie máxima para una sala de cultivo es de 25 metros cuadrados.' });
    }

    const updated = await prisma.space.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(surfaceAreaSqm !== undefined && { surfaceAreaSqm: Number(surfaceAreaSqm) }),
        ...(lightPowerWatts !== undefined && { lightPowerWatts: Number(lightPowerWatts) }),
        ...(maxPots !== undefined && { maxPots: Number(maxPots) }),
        ...(setup !== undefined && { setup })
      }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE space
app.delete('/api/spaces/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.space.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================
   HELPERS & UTILS
   ========================================================== */

// Helper to get or create a default user for mock/local sandbox setups
async function getOrCreateUserId(): Promise<string> {
  const defaultEmail = 'grower@cannatrack.pro';
  const existing = await prisma.user.findUnique({
    where: { email: defaultEmail }
  });
  if (existing) {
    return existing.id;
  }
  const newUser = await prisma.user.create({
    data: {
      email: defaultEmail,
      name: 'Cultivador Experto',
      password: 'pbkdf2_hashed_mock_password'
    }
  });
  return newUser.id;
}

async function ensureUserExists(userId: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (existing) return;
  await prisma.user.create({
    data: {
      id: userId,
      email: `${userId}@cannatrack.local`,
      name: 'Usuario Autocreado',
      password: 'pbkdf2_hashed_mock_password'
    }
  });
}

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Handler]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Cannatrack Pro API server running on http://localhost:${PORT}`);
});
