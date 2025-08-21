# 🏪 PawnBroker Pro

A comprehensive pawnshop management application that provides real-time market valuations for various items using multiple data sources including eBay, Amazon, and specialized price guides.

## 🚀 Features

- **Real-time Market Valuations**: Get instant price estimates from multiple sources
- **Image Recognition**: Identify items using camera and AI
- **Hierarchical Search**: Search → Brand Selection → Model Selection → Exact Product Pricing
- **Learning System**: Dynamic brand and model recognition from search results
- **Multi-platform**: React Native mobile app with Node.js backend
- **Real Data Only**: No mock data - all prices from live APIs

## 📱 Mobile App

Built with React Native and Expo, featuring:
- Modern, responsive UI
- Camera integration for item recognition
- Real-time search and valuation
- Offline capability with local storage

## 🔧 Backend API

Node.js/Express server with:
- Multiple data source integration (eBay, Amazon, Canopy API)
- Advanced caching system
- Security middleware
- Rate limiting and monitoring
- Learning system for brand/model recognition

## 🛠 Tech Stack

### Frontend
- React Native
- Expo
- TypeScript
- React Native Paper (UI components)
- AsyncStorage for local data

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Multiple API integrations
- Advanced caching (node-cache)
- Security middleware

### APIs & Services
- eBay API (Finding API)
- Canopy API (Amazon product data)
- Keepa API (Amazon price history)
- Google Cloud Vision (Image recognition)
- Firebase (Authentication & Storage)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI
- MongoDB Atlas account
- API keys for services

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pawnbroker-pro
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Mobile app
   cd ../mobile-app
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment variables
   cp backend/config/dev.env.example backend/config/dev.env
   # Edit with your API keys
   ```

4. **Start the backend**
   ```bash
   cd backend
   npm start
   ```

5. **Start the mobile app**
   ```bash
   cd mobile-app
   npx expo start
   ```

## 🔑 API Keys Required

- **Canopy API**: For Amazon product data
- **eBay API**: For eBay search and pricing
- **Keepa API**: For Amazon price history
- **Firebase**: For authentication and storage
- **Google Cloud Vision**: For image recognition

## 📊 Data Sources

- **eBay**: Real-time auction and buy-it-now prices
- **Amazon**: Product details and pricing via Canopy API
- **Keepa**: Historical Amazon price data
- **Learning System**: Dynamic brand/model recognition

## 🔒 Security Features

- Input validation and sanitization
- Rate limiting
- CORS protection
- Security headers
- SQL injection protection
- XSS protection

## 📈 Performance

- Response times: <2 seconds for searches
- Caching system for API responses
- Optimized database queries
- Mobile-optimized bundle size

## 🚀 Deployment

### Backend (Vercel)
```bash
vercel --prod
```

### Mobile App
- Build with Expo EAS
- Deploy to App Store/Google Play

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ for pawnbrokers everywhere**
