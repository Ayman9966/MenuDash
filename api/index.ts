import app from '../server';

export default async (req: any, res: any) => {
  try {
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel API Handler Error:', error);
    res.status(500).json({
      error: 'Vercel API Handler Error',
      message: error.message,
      stack: error.stack
    });
  }
};
