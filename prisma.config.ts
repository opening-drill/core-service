import { defineConfig } from 'prisma/config';

export default defineConfig({
  // Path to the schema file relative to the project directory or execution context
  schema: './prisma/schema.prisma',
  
  // Datasource URL is central to the config file in Prisma 7
  datasource: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:hashlama020@34.165.129.193:5432/AIrcraft-NP',
  },
  
  migrations: {
    path: './prisma/migrations',
  },
});
