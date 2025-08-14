/**
 * Application configuration and environment variables
 */

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL!,
    urlUnpooled: process.env.DATABASE_URL_UNPOOLED!,
  },

  // S3 Configuration
  s3: {
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    bucket: process.env.S3_BUCKET!,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
  },

  // AWS Configuration (alternative)
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    s3Bucket: process.env.AWS_S3_BUCKET!,
  },

  // Application
  app: {
    name: 'MedCare Solutions',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },

  // PDF Generation
  pdf: {
    defaultDollarRate: 89500,
    companyMofNumber: '513353-601',
  },

  // Company Information
  company: {
    name: 'MCS',
    phone: '+961 03 788345',
    whatsapp: '+961 70 072401',
    email: 'info@medcare-solutions.com',
    location: 'Beirut Lebanon',
  },
};

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  const required = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED'];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Get S3 configuration based on available environment variables
 */
export function getS3Config() {
  // Prefer S3_ prefixed variables
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    return {
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      endpoint: config.s3.endpoint,
      forcePathStyle: config.s3.forcePathStyle,
    };
  }

  // Fallback to AWS_ prefixed variables
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    };
  }

  return null;
}
