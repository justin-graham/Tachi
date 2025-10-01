/**
 * Database Backup and Disaster Recovery System
 * Handles automated backups, point-in-time recovery, and disaster recovery procedures
 */

import { createClient } from '@supabase/supabase-js';
import { connectionManager } from '../src/db/connection-pool.js';
import { createLogger } from '../src/utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const logger = createLogger();

class BackupManager {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, 'backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.s3Bucket = process.env.BACKUP_S3_BUCKET;
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    try {
      logger.info('🔧 Initializing backup system...');
      
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Test database connection
      await connectionManager.initialize();
      
      // Verify backup configuration
      await this.verifyConfiguration();
      
      logger.info('✅ Backup system initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize backup system:', error);
      throw error;
    }
  }

  /**
   * Verify backup configuration
   */
  async verifyConfiguration() {
    const issues = [];
    
    if (!process.env.SUPABASE_URL) {
      issues.push('SUPABASE_URL not configured');
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      issues.push('SUPABASE_SERVICE_ROLE_KEY not configured');
    }
    
    if (!this.s3Bucket) {
      logger.warn('⚠️ S3 backup storage not configured - backups will be local only');
    }
    
    if (!this.encryptionKey) {
      logger.warn('⚠️ Backup encryption not configured - backups will be unencrypted');
    }
    
    if (issues.length > 0) {
      throw new Error(`Backup configuration issues: ${issues.join(', ')}`);
    }
  }

  /**
   * Create full database backup
   */
  async createFullBackup() {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `full-backup-${timestamp}`;
    
    try {
      logger.info(`🔄 Starting full backup: ${backupId}...`);
      
      // Create backup metadata
      const metadata = {
        backupId,
        type: 'full',
        startTime: new Date().toISOString(),
        status: 'in_progress',
        tables: [],
        size: 0,
        checksums: {}
      };
      
      const backupPath = path.join(this.backupDir, `${backupId}.sql`);
      const metadataPath = path.join(this.backupDir, `${backupId}.json`);
      
      // Get list of tables to backup
      const tables = await this.getTableList();
      metadata.tables = tables;
      
      // Create SQL dump
      await this.createSQLDump(backupPath, tables);
      
      // Calculate backup size and checksums
      const stats = await fs.stat(backupPath);
      metadata.size = stats.size;
      metadata.checksums.sql = await this.calculateChecksum(backupPath);
      
      // Encrypt backup if configured
      if (this.encryptionKey) {
        const encryptedPath = `${backupPath}.encrypted`;
        await this.encryptFile(backupPath, encryptedPath);
        metadata.encrypted = true;
        metadata.checksums.encrypted = await this.calculateChecksum(encryptedPath);
        
        // Remove unencrypted file
        await fs.unlink(backupPath);
      }
      
      // Upload to S3 if configured
      if (this.s3Bucket) {
        const s3Key = await this.uploadToS3(
          this.encryptionKey ? `${backupPath}.encrypted` : backupPath,
          backupId
        );
        metadata.s3Key = s3Key;
      }
      
      // Save metadata
      metadata.status = 'completed';
      metadata.endTime = new Date().toISOString();
      metadata.duration = Date.now() - startTime;
      
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      // Log backup record
      await this.logBackupRecord(metadata);
      
      logger.info(`✅ Full backup completed: ${backupId} (${this.formatBytes(metadata.size)} in ${this.formatDuration(metadata.duration)})`);
      
      return metadata;
      
    } catch (error) {
      logger.error(`❌ Full backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Create incremental backup (since last backup)
   */
  async createIncrementalBackup() {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `incremental-backup-${timestamp}`;
    
    try {
      logger.info(`🔄 Starting incremental backup: ${backupId}...`);
      
      // Get last backup timestamp
      const lastBackup = await this.getLastBackupTime();
      
      if (!lastBackup) {
        logger.warn('⚠️ No previous backup found, creating full backup instead');
        return await this.createFullBackup();
      }
      
      // Create backup metadata
      const metadata = {
        backupId,
        type: 'incremental',
        startTime: new Date().toISOString(),
        lastBackupTime: lastBackup,
        status: 'in_progress',
        changes: [],
        size: 0
      };
      
      // Get changed data since last backup
      const changes = await this.getIncrementalChanges(lastBackup);
      metadata.changes = changes;
      
      if (changes.length === 0) {
        logger.info('ℹ️ No changes detected since last backup');
        metadata.status = 'no_changes';
        metadata.endTime = new Date().toISOString();
        metadata.duration = Date.now() - startTime;
        return metadata;
      }
      
      // Create incremental backup file
      const backupPath = path.join(this.backupDir, `${backupId}.json`);
      await fs.writeFile(backupPath, JSON.stringify(changes, null, 2));
      
      // Calculate backup size
      const stats = await fs.stat(backupPath);
      metadata.size = stats.size;
      metadata.checksum = await this.calculateChecksum(backupPath);
      
      // Upload to S3 if configured
      if (this.s3Bucket) {
        const s3Key = await this.uploadToS3(backupPath, backupId);
        metadata.s3Key = s3Key;
      }
      
      // Save metadata
      metadata.status = 'completed';
      metadata.endTime = new Date().toISOString();
      metadata.duration = Date.now() - startTime;
      
      const metadataPath = path.join(this.backupDir, `${backupId}.metadata.json`);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      // Log backup record
      await this.logBackupRecord(metadata);
      
      logger.info(`✅ Incremental backup completed: ${backupId} (${changes.length} changes, ${this.formatBytes(metadata.size)})`);
      
      return metadata;
      
    } catch (error) {
      logger.error(`❌ Incremental backup failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Get list of tables to backup
   */
  async getTableList() {
    try {
      const query = `
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != 'schema_migrations'
        ORDER BY tablename
      `;
      
      const result = await connectionManager.query(query);
      return result.rows.map(row => row.tablename);
      
    } catch (error) {
      logger.error('❌ Failed to get table list:', error);
      throw error;
    }
  }

  /**
   * Create SQL dump using pg_dump
   */
  async createSQLDump(outputPath, tables) {
    return new Promise((resolve, reject) => {
      const connectionString = this.buildConnectionString();
      
      const args = [
        connectionString,
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
        '--verbose'
      ];
      
      // Add specific tables if provided
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          args.push('-t', table);
        });
      }
      
      const pgDump = spawn('pg_dump', args);
      const writeStream = require('fs').createWriteStream(outputPath);
      
      pgDump.stdout.pipe(writeStream);
      
      let errorOutput = '';
      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pgDump.on('close', (code) => {
        writeStream.close();
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });
      
      pgDump.on('error', reject);
    });
  }

  /**
   * Get incremental changes since last backup
   */
  async getIncrementalChanges(lastBackupTime) {
    try {
      const changes = [];
      
      // Define tables that support incremental backups (have updated_at or created_at)
      const incrementalTables = [
        'publishers',
        'crawlers',
        'transactions',
        'payments',
        'payment_events',
        'domain_pricing',
        'analytics_daily'
      ];
      
      for (const table of incrementalTables) {
        const tableChanges = await this.getTableChanges(table, lastBackupTime);
        if (tableChanges.length > 0) {
          changes.push({
            table,
            changes: tableChanges,
            count: tableChanges.length
          });
        }
      }
      
      return changes;
      
    } catch (error) {
      logger.error('❌ Failed to get incremental changes:', error);
      throw error;
    }
  }

  /**
   * Get changes for a specific table
   */
  async getTableChanges(table, sinceTime) {
    try {
      // Try different timestamp columns
      const timestampColumns = ['updated_at', 'created_at', 'applied_at'];
      let timestampColumn = null;
      
      for (const col of timestampColumns) {
        const checkQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `;
        
        const result = await connectionManager.query(checkQuery, [table, col]);
        if (result.rows.length > 0) {
          timestampColumn = col;
          break;
        }
      }
      
      if (!timestampColumn) {
        logger.warn(`⚠️ No timestamp column found for table ${table}, skipping incremental backup`);
        return [];
      }
      
      const query = `SELECT * FROM ${table} WHERE ${timestampColumn} > $1 ORDER BY ${timestampColumn}`;
      const result = await connectionManager.query(query, [sinceTime]);
      
      return result.rows;
      
    } catch (error) {
      logger.error(`❌ Failed to get changes for table ${table}:`, error);
      return [];
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupId, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info(`🔄 Starting database restore from backup: ${backupId}...`);
      
      if (process.env.NODE_ENV === 'production' && !options.confirmRestore) {
        throw new Error('❌ Database restore in production requires explicit confirmation');
      }
      
      // Load backup metadata
      const metadataPath = path.join(this.backupDir, `${backupId}.json`);
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      
      if (metadata.type === 'full') {
        await this.restoreFullBackup(backupId, metadata, options);
      } else if (metadata.type === 'incremental') {
        await this.restoreIncrementalBackup(backupId, metadata, options);
      } else {
        throw new Error(`Unknown backup type: ${metadata.type}`);
      }
      
      const duration = Date.now() - startTime;
      logger.info(`✅ Database restore completed in ${this.formatDuration(duration)}`);
      
      // Log restore operation
      await this.logRestoreRecord({
        backupId,
        restoreTime: new Date().toISOString(),
        duration,
        options
      });
      
    } catch (error) {
      logger.error(`❌ Database restore failed: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * Restore from full backup
   */
  async restoreFullBackup(backupId, metadata, options) {
    try {
      let backupPath = path.join(this.backupDir, `${backupId}.sql`);
      
      // Download from S3 if needed
      if (metadata.s3Key && !await this.fileExists(backupPath)) {
        backupPath = await this.downloadFromS3(metadata.s3Key, backupId);
      }
      
      // Decrypt if needed
      if (metadata.encrypted) {
        const encryptedPath = `${backupPath}.encrypted`;
        if (await this.fileExists(encryptedPath)) {
          await this.decryptFile(encryptedPath, backupPath);
        }
      }
      
      // Verify backup integrity
      const actualChecksum = await this.calculateChecksum(backupPath);
      const expectedChecksum = metadata.checksums?.sql || metadata.checksum;
      
      if (actualChecksum !== expectedChecksum) {
        throw new Error('Backup integrity check failed - checksum mismatch');
      }
      
      // Execute restore
      await this.executeSQLRestore(backupPath, options);
      
    } catch (error) {
      logger.error('❌ Full backup restore failed:', error);
      throw error;
    }
  }

  /**
   * Execute SQL restore using psql
   */
  async executeSQLRestore(sqlPath, options = {}) {
    return new Promise((resolve, reject) => {
      const connectionString = this.buildConnectionString();
      
      const args = [
        connectionString,
        '--file', sqlPath,
        '--verbose'
      ];
      
      if (options.singleTransaction) {
        args.push('--single-transaction');
      }
      
      const psql = spawn('psql', args);
      
      let errorOutput = '';
      psql.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      psql.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`psql restore failed with code ${code}: ${errorOutput}`));
        }
      });
      
      psql.on('error', reject);
    });
  }

  /**
   * Cleanup old backups based on retention policy
   */
  async cleanupOldBackups() {
    try {
      logger.info('🧹 Starting backup cleanup...');
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      const files = await fs.readdir(this.backupDir);
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.json') && file.includes('backup-')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            // Delete backup files
            const baseName = file.replace('.json', '').replace('.metadata', '');
            const filesToDelete = [
              `${baseName}.json`,
              `${baseName}.metadata.json`,
              `${baseName}.sql`,
              `${baseName}.sql.encrypted`
            ];
            
            for (const fileToDelete of filesToDelete) {
              const deleteePath = path.join(this.backupDir, fileToDelete);
              try {
                await fs.unlink(deleteePath);
                deletedCount++;
              } catch (error) {
                // File might not exist, ignore
              }
            }
          }
        }
      }
      
      logger.info(`✅ Cleanup completed: deleted ${deletedCount} old backup files`);
      
    } catch (error) {
      logger.error('❌ Backup cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get backup status and statistics
   */
  async getBackupStatus() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];
      
      for (const file of files) {
        if (file.endsWith('.json') && !file.includes('.metadata')) {
          const filePath = path.join(this.backupDir, file);
          const metadata = JSON.parse(await fs.readFile(filePath, 'utf8'));
          backups.push(metadata);
        }
      }
      
      // Sort by start time
      backups.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      
      const stats = {
        totalBackups: backups.length,
        lastBackup: backups[0] || null,
        fullBackups: backups.filter(b => b.type === 'full').length,
        incrementalBackups: backups.filter(b => b.type === 'incremental').length,
        totalSize: backups.reduce((sum, b) => sum + (b.size || 0), 0),
        oldestBackup: backups[backups.length - 1] || null,
        recentBackups: backups.slice(0, 10)
      };
      
      return {
        status: 'healthy',
        statistics: stats,
        retentionPolicy: `${this.retentionDays} days`,
        s3Enabled: !!this.s3Bucket,
        encryptionEnabled: !!this.encryptionKey
      };
      
    } catch (error) {
      logger.error('❌ Failed to get backup status:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Schedule automated backups
   */
  scheduleBackups() {
    // Full backup weekly (Sundays at 2 AM)
    const fullBackupSchedule = '0 2 * * 0';
    
    // Incremental backup daily (at 2 AM, except Sundays)
    const incrementalBackupSchedule = '0 2 * * 1-6';
    
    // Cleanup monthly (first day of month at 3 AM)
    const cleanupSchedule = '0 3 1 * *';
    
    logger.info('📅 Scheduling automated backups...');
    logger.info(`   Full backup: ${fullBackupSchedule}`);
    logger.info(`   Incremental backup: ${incrementalBackupSchedule}`);
    logger.info(`   Cleanup: ${cleanupSchedule}`);
    
    // In a production environment, you would use a proper cron scheduler
    // For now, we'll set up simple intervals
    
    // Full backup weekly (every 7 days)
    setInterval(async () => {
      try {
        await this.createFullBackup();
      } catch (error) {
        logger.error('❌ Scheduled full backup failed:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000);
    
    // Incremental backup daily
    setInterval(async () => {
      try {
        await this.createIncrementalBackup();
      } catch (error) {
        logger.error('❌ Scheduled incremental backup failed:', error);
      }
    }, 24 * 60 * 60 * 1000);
    
    // Cleanup monthly
    setInterval(async () => {
      try {
        await this.cleanupOldBackups();
      } catch (error) {
        logger.error('❌ Scheduled cleanup failed:', error);
      }
    }, 30 * 24 * 60 * 60 * 1000);
  }

  // Utility methods
  buildConnectionString() {
    const host = process.env.SUPABASE_DB_HOST || 'localhost';
    const port = process.env.SUPABASE_DB_PORT || 5432;
    const database = process.env.SUPABASE_DB_NAME || 'postgres';
    const username = process.env.SUPABASE_DB_USER || 'postgres';
    const password = process.env.SUPABASE_DB_PASSWORD || '';
    
    return `postgresql://${username}:${password}@${host}:${port}/${database}`;
  }

  async calculateChecksum(filePath) {
    const content = await fs.readFile(filePath);
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  async getLastBackupTime() {
    try {
      const query = `
        SELECT MAX(start_time) as last_backup 
        FROM backup_log 
        WHERE status = 'completed'
      `;
      
      const result = await connectionManager.query(query);
      return result.rows[0]?.last_backup || null;
      
    } catch (error) {
      // Table might not exist yet
      return null;
    }
  }

  async logBackupRecord(metadata) {
    try {
      const query = `
        INSERT INTO backup_log (
          backup_id, type, status, start_time, end_time, 
          duration_ms, size_bytes, table_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      await connectionManager.query(query, [
        metadata.backupId,
        metadata.type,
        metadata.status,
        metadata.startTime,
        metadata.endTime,
        metadata.duration,
        metadata.size,
        metadata.tables?.length || 0
      ]);
      
    } catch (error) {
      logger.warn('Failed to log backup record:', error);
    }
  }

  async logRestoreRecord(restoreData) {
    try {
      const query = `
        INSERT INTO restore_log (
          backup_id, restore_time, duration_ms, options
        ) VALUES ($1, $2, $3, $4)
      `;
      
      await connectionManager.query(query, [
        restoreData.backupId,
        restoreData.restoreTime,
        restoreData.duration,
        JSON.stringify(restoreData.options)
      ]);
      
    } catch (error) {
      logger.warn('Failed to log restore record:', error);
    }
  }

  // Placeholder methods for S3 and encryption (implement based on your needs)
  async uploadToS3(filePath, backupId) {
    // Implement S3 upload logic
    logger.info(`📤 Would upload ${filePath} to S3 as ${backupId}`);
    return `s3://${this.s3Bucket}/${backupId}`;
  }

  async downloadFromS3(s3Key, backupId) {
    // Implement S3 download logic
    logger.info(`📥 Would download ${s3Key} from S3`);
    return path.join(this.backupDir, `${backupId}.sql`);
  }

  async encryptFile(inputPath, outputPath) {
    // Implement file encryption
    logger.info(`🔒 Would encrypt ${inputPath} to ${outputPath}`);
  }

  async decryptFile(inputPath, outputPath) {
    // Implement file decryption
    logger.info(`🔓 Would decrypt ${inputPath} to ${outputPath}`);
  }
}

// CLI interface
async function main() {
  const backupManager = new BackupManager();
  const command = process.argv[2] || 'status';
  
  try {
    await backupManager.initialize();
    
    switch (command) {
      case 'full':
        await backupManager.createFullBackup();
        break;
      case 'incremental':
        await backupManager.createIncrementalBackup();
        break;
      case 'restore':
        const backupId = process.argv[3];
        if (!backupId) {
          console.log('Usage: node backup-recovery.js restore <backup-id>');
          process.exit(1);
        }
        await backupManager.restoreFromBackup(backupId);
        break;
      case 'cleanup':
        await backupManager.cleanupOldBackups();
        break;
      case 'schedule':
        backupManager.scheduleBackups();
        console.log('✅ Backup scheduling enabled');
        break;
      case 'status':
        const status = await backupManager.getBackupStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
      default:
        console.log('Usage: node backup-recovery.js [full|incremental|restore|cleanup|schedule|status]');
        process.exit(1);
    }
    
    console.log('🎉 Operation completed successfully');
    
  } catch (error) {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default BackupManager;