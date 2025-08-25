import { RewardedAd, TestIds, RewardedAdEventType } from 'react-native-google-mobile-ads';

class RewardedAdService {
  private rewardedAd: RewardedAd | null = null;
  private isAdLoaded = false;
  private onRewardedCallback: (() => void) | null = null;

  constructor() {
    this.initializeAd();
  }

  private initializeAd() {
    // Use test ad unit ID for development, real ad unit ID for production
    const adUnitId = __DEV__ 
      ? TestIds.REWARDED 
      : 'ca-app-pub-7869206132163225/2496866821';

    this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
      keywords: ['pawn', 'jewelry', 'electronics', 'tools', 'antiques'],
    });

    this.setupEventListeners();
    this.loadAd();
  }

  private setupEventListeners() {
    if (!this.rewardedAd) return;

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded ad loaded');
      this.isAdLoaded = true;
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
      console.error('Rewarded ad error:', error);
      this.isAdLoaded = false;
      // Retry loading after error
      setTimeout(() => this.loadAd(), 30000);
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      console.log('Rewarded ad closed');
      this.isAdLoaded = false;
      this.loadAd(); // Preload next ad
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('User earned reward:', reward);
      if (this.onRewardedCallback) {
        this.onRewardedCallback();
        this.onRewardedCallback = null;
      }
    });
  }

  private loadAd() {
    if (this.rewardedAd && !this.isAdLoaded) {
      this.rewardedAd.load();
    }
  }

  public async showRewardedAd(onRewarded: () => void): Promise<boolean> {
    if (!this.rewardedAd) {
      console.error('Rewarded ad not initialized');
      return false;
    }

    if (!this.isAdLoaded) {
      console.log('Rewarded ad not loaded, loading...');
      this.loadAd();
      return false;
    }

    try {
      this.onRewardedCallback = onRewarded;
      await this.rewardedAd.show();
      return true;
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      this.onRewardedCallback = null;
      return false;
    }
  }

  public isAdReady(): boolean {
    return this.isAdLoaded;
  }

  public preloadAd() {
    this.loadAd();
  }
}

// Export singleton instance
export const rewardedAdService = new RewardedAdService();
export default RewardedAdService;
