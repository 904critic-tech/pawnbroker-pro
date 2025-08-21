# PawnBroker Pro - Android App

A professional Android application for pawnbrokers to quickly estimate item values and calculate pawn offers using AI-powered image recognition and market data analysis.

## 🎯 Features

### Core Functionality
- **AI Image Recognition**: Capture photos to automatically identify items
- **Market Value Estimation**: Get real-time market value estimates based on eBay and other marketplace data
- **Pawn Offer Calculation**: Automatic 30% pawn value calculation with customizable percentages
- **Item Confirmation**: Review and adjust item details before final pricing
- **Search by Name**: Text-based search for items when photos aren't available

### Monetization
- **Ad-Based Model**: 5 free queries per day
- **Rewarded Ads**: Watch ads for +3 bonus queries
- **Premium Upgrade**: $9.99/month for unlimited queries (future feature)
- **Real AdMob Integration**: Banner and rewarded video ads

### Professional Features
- **Dark Theme UI**: Premium dark mode interface
- **Query Limits**: Daily usage tracking with intelligent prompts
- **History Management**: Track all previous estimates
- **Settings Customization**: Adjust pawn percentages and preferences
- **Real-time Data**: Live market data integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Android Studio
- Android SDK (API 33+)
- Java Development Kit (JDK) 11+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pawnbroker-pro-android
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on Android device/emulator**
   ```bash
   npm run android
   ```

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
│   ├── AdBanner.tsx    # AdMob banner ads
│   ├── QueryLimitBanner.tsx # Query limit notifications
│   └── LoadingOverlay.tsx   # Global loading states
├── context/            # React Context providers
│   └── AppContext.tsx  # Global app state management
├── screens/            # Main app screens
│   ├── HomeScreen.tsx  # Dashboard with quick actions
│   ├── CameraScreen.tsx # Image capture and recognition
│   ├── SearchScreen.tsx # Text-based item search
│   ├── ItemConfirmationScreen.tsx # Item details review
│   ├── ResultsScreen.tsx # Pricing results display
│   ├── HistoryScreen.tsx # Estimate history
│   └── SettingsScreen.tsx # App preferences
├── services/           # API and business logic
│   ├── api.ts         # Backend API integration
│   ├── PricingService.ts # Core pricing logic
│   └── RewardedAdService.ts # AdMob rewarded ads
└── theme/             # UI theming
    └── theme.ts       # Dark theme configuration
```

## 🎨 Design System

### Color Palette
- **Primary**: Deep Blue (#1a1a2e)
- **Secondary**: Gold Accent (#ffd700)
- **Success**: Emerald (#10b981)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Headlines**: Roboto Bold
- **Body**: Roboto Regular
- **Labels**: Roboto Medium

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Backend API
API_BASE_URL=http://localhost:5001/api

# AdMob Configuration
ADMOB_APP_ID=ca-app-pub-7869206132163225~6227378217
ADMOB_BANNER_ID=ca-app-pub-7869206132163225/2632598195
ADMOB_REWARDED_ID=ca-app-pub-7869206132163225/2496866821

# Development Settings
NODE_ENV=development
```

### Android Permissions
The app requires the following Android permissions:
- `CAMERA` - For item photo capture
- `READ_EXTERNAL_STORAGE` - For gallery access
- `WRITE_EXTERNAL_STORAGE` - For saving images
- `INTERNET` - For API calls and ads
- `ACCESS_NETWORK_STATE` - For network status

## 🏗️ Building for Production

### Generate Release APK

1. **Create keystore** (first time only)
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing** in `android/gradle.properties`:
   ```properties
   MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
   MYAPP_UPLOAD_STORE_PASSWORD=*****
   MYAPP_UPLOAD_KEY_PASSWORD=*****
   ```

3. **Build release APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

### Generate App Bundle (Recommended for Play Store)
```bash
cd android
./gradlew bundleRelease
```

## 📊 Analytics & Monitoring

### AdMob Integration
- **Banner Ads**: Displayed on home screen
- **Rewarded Video**: Triggered when users need more queries
- **Revenue Tracking**: Automatic earnings monitoring

### Performance Metrics
- Query success rates
- User engagement metrics
- Ad performance data
- App crash reporting

## 🔒 Security Features

- **Input Validation**: All user inputs are sanitized
- **API Security**: JWT token authentication
- **Data Encryption**: Sensitive data encrypted in storage
- **Network Security**: HTTPS-only API communication

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Google Play Store

1. **Create Play Console account**
2. **Upload APK/AAB** to internal testing
3. **Configure store listing**:
   - App name: "PawnBroker Pro"
   - Category: Business
   - Content rating: Everyone
4. **Submit for review**

### Release Checklist
- [ ] All tests passing
- [ ] AdMob ads configured
- [ ] API endpoints tested
- [ ] Performance optimized
- [ ] Privacy policy updated
- [ ] Terms of service updated

## 📈 Roadmap

### Version 1.1
- [ ] Offline mode support
- [ ] Barcode scanning
- [ ] Multiple currency support
- [ ] Export estimates to PDF

### Version 1.2
- [ ] Advanced AI recognition
- [ ] Bulk item processing
- [ ] Customer management
- [ ] Inventory tracking

### Version 2.0
- [ ] iOS companion app
- [ ] Web dashboard
- [ ] Multi-user support
- [ ] Advanced analytics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Email**: support@pawnbrokerpro.com

## 🏆 Acknowledgments

- React Native team for the amazing framework
- Expo team for development tools
- Google AdMob for monetization platform
- React Native Paper for UI components

---

**PawnBroker Pro** - Professional pricing intelligence for modern pawnbrokers.
