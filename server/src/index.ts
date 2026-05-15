import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Travel Guide API is running');
});

// GET /api/destinations
app.get('/api/destinations', async (req: Request, res: Response) => {
  try {
    const destinations = await prisma.destination.findMany();
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// GET /api/guides (with filtering)
app.get('/api/guides', async (req: Request, res: Response) => {
  try {
    const { region, theme, q } = req.query;

    const where: any = {};
    
    if (region || theme) {
      where.destination = {};
      if (region) {
        where.destination.region = region as string;
      }
      if (theme) {
        where.destination.tags = {
          has: theme as string
        };
      }
    }
    
    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { author: { contains: q as string, mode: 'insensitive' } }
      ];
    }

    const guides = await prisma.guide.findMany({
      where,
      include: {
        destination: true
      }
    });

    res.json(guides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

// GET /api/guides/:id
app.get('/api/guides/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const guide = await prisma.guide.findUnique({
      where: { id },
      include: {
        destination: true
      }
    });
    
    if (guide) {
      res.json(guide);
    } else {
      res.status(404).json({ message: 'Guide not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guide' });
  }
});

// GET /api/favorites
app.get('/api/favorites', async (req: Request, res: Response) => {
  try {
    const favorites = await prisma.favorite.findMany({
      include: {
        guide: {
          include: {
            destination: true
          }
        }
      }
    });
    
    const favoriteGuides = favorites.map(f => f.guide);
    res.json(favoriteGuides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/favorites/:guideId
app.post('/api/favorites/:guideId', async (req: Request, res: Response) => {
  try {
    const guideId = req.params.guideId as string;
    
    // Check if it already exists to avoid duplicates
    const existing = await prisma.favorite.findFirst({
      where: { guideId }
    });
    
    if (!existing) {
      await prisma.favorite.create({
        data: { guideId }
      });
    }
    
    const favorites = await prisma.favorite.findMany();
    const favoriteIds = favorites.map(f => f.guideId);
    
    res.status(201).json({ message: 'Added to favorites', favoriteIds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// DELETE /api/favorites/:guideId
app.delete('/api/favorites/:guideId', async (req: Request, res: Response) => {
  try {
    const guideId = req.params.guideId as string;
    
    await prisma.favorite.deleteMany({
      where: { guideId }
    });
    
    const favorites = await prisma.favorite.findMany();
    const favoriteIds = favorites.map(f => f.guideId);
    
    res.json({ message: 'Removed from favorites', favoriteIds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
