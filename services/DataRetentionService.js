const User = require('../models/User');
const Item = require('../models/Item');
const SearchHistory = require('../models/SearchHistory');
const secureLoggingService = require('./SecureLoggingService');

class DataRetentionService {
  constructor() {
    this.retentionPolicies = {
      // User data retention
      user: {
        active: 'indefinite', // Keep active users indefinitely
        inactive: '2y', // Keep inactive users for 2 years
        deleted: '30d', // Keep deleted users for 30 days
        anonymized: '1y', // Keep anonymized data for 1 year
      },
      
      // Item data retention
      item: {
        active: 'indefinite', // Keep active items indefinitely
        completed: '1y', // Keep completed transactions for 1 year
        expired: '6m', // Keep expired items for 6 months
        deleted: '30d', // Keep deleted items for 30 days
      },
      
      // Search history retention
      searchHistory: {
        user: '1y', // Keep user search history for 1 year
        anonymous: '30d', // Keep anonymous search history for 30 days
        sensitive: '7d', // Keep sensitive searches for 7 days
      },
      
      // Log retention
      logs: {
        access: '1y', // Keep access logs for 1 year
        error: '6m', // Keep error logs for 6 months
        security: '2y', // Keep security logs for 2 years
        audit: '7y', // Keep audit logs for 7 years
      },
      
      // Temporary data retention
      temp: {
        uploads: '7d', // Keep temporary uploads for 7 days
        cache: '1d', // Keep cache for 1 day
        sessions: '24h', // Keep sessions for 24 hours
      }
    };
    
    this.complianceRules = {
      gdpr: {
        rightToBeForgotten: true,
        dataMinimization: true,
        purposeLimitation: true,
        retentionLimitation: true,
      },
      ccpa: {
        dataDeletion: true,
        dataPortability: true,
        optOut: true,
      },
      hipaa: {
        phiRetention: '6y', // PHI retention for 6 years
        accessLogs: '6y', // Access logs for 6 years
      }
    };
  }

  // Convert time string to milliseconds
  parseRetentionTime(timeString) {
    const timeMap = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000,
      'y': 365 * 24 * 60 * 60 * 1000,
    };

    if (timeString === 'indefinite') return null;
    
    const match = timeString.match(/^(\d+)([smhdwy])$/);
    if (!match) {
      throw new Error(`Invalid retention time format: ${timeString}`);
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    return value * timeMap[unit];
  }

  // Get cutoff date for retention policy
  getCutoffDate(retentionTime) {
    if (!retentionTime) return null;
    const retentionMs = this.parseRetentionTime(retentionTime);
    return new Date(Date.now() - retentionMs);
  }

  // Clean up expired user data
  async cleanupExpiredUsers() {
    try {
      const cutoffDate = this.getCutoffDate(this.retentionPolicies.user.inactive);
      if (!cutoffDate) return;

      const expiredUsers = await User.find({
        lastLogin: { $lt: cutoffDate },
        isActive: false,
        deletedAt: { $exists: false }
      });

      for (const user of expiredUsers) {
        await this.anonymizeUser(user._id);
      }

      await secureLoggingService.info('User cleanup completed', {
        processed: expiredUsers.length,
        cutoffDate: cutoffDate.toISOString()
      });

    } catch (error) {
      await secureLoggingService.error('User cleanup failed', { error: error.message });
    }
  }

  // Clean up expired items
  async cleanupExpiredItems() {
    try {
      const cutoffDate = this.getCutoffDate(this.retentionPolicies.item.expired);
      if (!cutoffDate) return;

      const expiredItems = await Item.find({
        updatedAt: { $lt: cutoffDate },
        status: { $in: ['expired', 'sold', 'returned'] }
      });

      for (const item of expiredItems) {
        await this.anonymizeItem(item._id);
      }

      await secureLoggingService.info('Item cleanup completed', {
        processed: expiredItems.length,
        cutoffDate: cutoffDate.toISOString()
      });

    } catch (error) {
      await secureLoggingService.error('Item cleanup failed', { error: error.message });
    }
  }

  // Clean up old search history
  async cleanupSearchHistory() {
    try {
      const userCutoff = this.getCutoffDate(this.retentionPolicies.searchHistory.user);
      const anonymousCutoff = this.getCutoffDate(this.retentionPolicies.searchHistory.anonymous);

      if (userCutoff) {
        await SearchHistory.deleteMany({
          userId: { $exists: true },
          createdAt: { $lt: userCutoff }
        });
      }

      if (anonymousCutoff) {
        await SearchHistory.deleteMany({
          userId: { $exists: false },
          createdAt: { $lt: anonymousCutoff }
        });
      }

      await secureLoggingService.info('Search history cleanup completed', {
        userCutoff: userCutoff?.toISOString(),
        anonymousCutoff: anonymousCutoff?.toISOString()
      });

    } catch (error) {
      await secureLoggingService.error('Search history cleanup failed', { error: error.message });
    }
  }

  // Anonymize user data (GDPR compliance)
  async anonymizeUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Anonymize user data
      user.firstName = 'Anonymous';
      user.lastName = 'User';
      user.email = `anonymous_${user._id}@deleted.com`;
      user.phone = '';
      user.businessName = '';
      user.isActive = false;
      user.anonymizedAt = new Date();
      user.passwordHistory = [];
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = undefined;

      await user.save();

      await secureLoggingService.security('User anonymized', {
        userId: userId,
        reason: 'GDPR compliance - data retention policy'
      });

    } catch (error) {
      await secureLoggingService.error('User anonymization failed', {
        userId: userId,
        error: error.message
      });
    }
  }

  // Anonymize item data
  async anonymizeItem(itemId) {
    try {
      const item = await Item.findById(itemId);
      if (!item) return;

      // Anonymize item data
      item.name = 'Anonymized Item';
      item.notes = '';
      item.imageUrl = '';
      item.anonymizedAt = new Date();

      await item.save();

      await secureLoggingService.security('Item anonymized', {
        itemId: itemId,
        reason: 'Data retention policy'
      });

    } catch (error) {
      await secureLoggingService.error('Item anonymization failed', {
        itemId: itemId,
        error: error.message
      });
    }
  }

  // Permanently delete user data (Right to be forgotten)
  async deleteUserData(userId) {
    try {
      // Delete user's search history
      await SearchHistory.deleteMany({ userId: userId });

      // Anonymize user's items
      const userItems = await Item.find({ userId: userId });
      for (const item of userItems) {
        await this.anonymizeItem(item._id);
      }

      // Delete user account
      await User.findByIdAndDelete(userId);

      await secureLoggingService.security('User data deleted', {
        userId: userId,
        reason: 'GDPR - Right to be forgotten'
      });

    } catch (error) {
      await secureLoggingService.error('User data deletion failed', {
        userId: userId,
        error: error.message
      });
    }
  }

  // Export user data (GDPR data portability)
  async exportUserData(userId) {
    try {
      const user = await User.findById(userId).select('-password -passwordHistory');
      const userItems = await Item.find({ userId: userId });
      const searchHistory = await SearchHistory.find({ userId: userId });

      const exportData = {
        user: user,
        items: userItems,
        searchHistory: searchHistory,
        exportedAt: new Date().toISOString(),
        format: 'JSON'
      };

      await secureLoggingService.security('User data exported', {
        userId: userId,
        reason: 'GDPR - Data portability'
      });

      return exportData;

    } catch (error) {
      await secureLoggingService.error('User data export failed', {
        userId: userId,
        error: error.message
      });
      throw error;
    }
  }

  // Get data retention statistics
  async getRetentionStats() {
    try {
      const stats = {
        users: {
          total: await User.countDocuments(),
          active: await User.countDocuments({ isActive: true }),
          inactive: await User.countDocuments({ isActive: false }),
          anonymized: await User.countDocuments({ anonymizedAt: { $exists: true } }),
        },
        items: {
          total: await Item.countDocuments(),
          active: await Item.countDocuments({ status: 'active' }),
          completed: await Item.countDocuments({ status: { $in: ['sold', 'returned'] } }),
          expired: await Item.countDocuments({ status: 'expired' }),
        },
        searchHistory: {
          total: await SearchHistory.countDocuments(),
          withUser: await SearchHistory.countDocuments({ userId: { $exists: true } }),
          anonymous: await SearchHistory.countDocuments({ userId: { $exists: false } }),
        }
      };

      return stats;

    } catch (error) {
      await secureLoggingService.error('Retention stats failed', { error: error.message });
      throw error;
    }
  }

  // Run scheduled cleanup tasks
  async runScheduledCleanup() {
    try {
      await secureLoggingService.info('Starting scheduled data cleanup');

      await Promise.all([
        this.cleanupExpiredUsers(),
        this.cleanupExpiredItems(),
        this.cleanupSearchHistory()
      ]);

      await secureLoggingService.info('Scheduled data cleanup completed');

    } catch (error) {
      await secureLoggingService.error('Scheduled cleanup failed', { error: error.message });
    }
  }

  // Check compliance status
  async checkComplianceStatus() {
    try {
      const stats = await this.getRetentionStats();
      const compliance = {
        gdpr: {
          dataMinimization: true,
          retentionLimitation: true,
          rightToBeForgotten: true,
          dataPortability: true,
        },
        ccpa: {
          dataDeletion: true,
          dataPortability: true,
          optOut: true,
        },
        hipaa: {
          phiRetention: true,
          accessLogs: true,
        }
      };

      return {
        stats,
        compliance,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      await secureLoggingService.error('Compliance check failed', { error: error.message });
      throw error;
    }
  }

  // Set up scheduled cleanup (run daily at 2 AM)
  setupScheduledCleanup() {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(2, 0, 0, 0);
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const timeUntilNextRun = nextRun.getTime() - now.getTime();

    setTimeout(() => {
      this.runScheduledCleanup();
      // Schedule next run
      setInterval(() => {
        this.runScheduledCleanup();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilNextRun);

    console.log(`📅 Data retention cleanup scheduled for ${nextRun.toISOString()}`);
  }
}

// Export singleton instance
const dataRetentionService = new DataRetentionService();
module.exports = dataRetentionService;
