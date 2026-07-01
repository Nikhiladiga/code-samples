import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_NAME: process.env.DB_NAME || 'typesense_books',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),

  TYPESENSE_HOST: process.env.TYPESENSE_HOST || 'localhost',
  TYPESENSE_PORT: parseInt(process.env.TYPESENSE_PORT || '8108', 10),
  TYPESENSE_PROTOCOL: process.env.TYPESENSE_PROTOCOL || 'http',
  TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY || 'xyz',
};
