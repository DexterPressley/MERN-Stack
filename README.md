# CalZone 🍕

> A comprehensive nutrition tracking platform for managing daily calorie and macronutrient intake across web and mobile devices.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

CalZone is a full-stack nutrition tracking application developed as part of the COP 4331 (Processes of Object-Oriented Software Development) course. The platform enables users to track their daily food intake, set personalized macro goals, and monitor their nutritional progress through both web and mobile interfaces.

The application features a comprehensive food library with detailed macronutrient information, barcode scanning capabilities, customizable daily tracking with meal categorization, and secure user authentication with email verification.

## ✨ Features

### User Management
- 🔐 Secure user registration with email verification
- 🔑 JWT-based authentication with automatic token refresh
- 📧 Password recovery and username retrieval via email
- 👤 Customizable user profiles with nutritional goals

### Food Tracking
- 🍎 Comprehensive food library with macronutrient data (calories, protein, carbs, fat)
- 🔍 Smart food search functionality
- 📊 Custom food creation with per-unit nutritional information
- 🏷️ Optional UPC barcode support for food items

### Daily Tracking
- 📅 Date-based food entry logging
- 🍽️ Meal type categorization (Breakfast, Lunch, Dinner, Snack)
- 📈 Real-time macro calculations and progress tracking
- ⏰ Customizable day rollover time for flexible tracking schedules
- 🎯 Personalized calorie and macro goals

### Multi-Platform Support
- 💻 Responsive web application (React + Vite)
- 📱 Native mobile application (Flutter)
- 🔄 Unified backend API serving both platforms

## 🛠️ Tech Stack

### Frontend
- **Web**: React 18 with Vite for fast development and optimized builds
- **Mobile**: Flutter for cross-platform iOS and Android support
- **Design**: Figma for UI/UX prototyping and design systems

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB Atlas (cloud-hosted)
- **Authentication**: JWT (jsonwebtoken) with bcrypt password hashing
- **Email Service**: SendGrid for transactional emails
- **API Documentation**: OpenAPI 3.0 (Swagger)

### Infrastructure
- **Hosting**: Digital Ocean Droplet (Ubuntu 22.04 LTS x64)
- **Database**: MongoDB Atlas
- **Version Control**: Git & GitHub

## 🏗️ Architecture

CalZone follows a modern three-tier architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  ┌──────────────────────┐  ┌──────────────────────┐     │
│  │   Web Application    │  │  Mobile Application  │     │
│  │   (React + Vite)     │  │     (Flutter)        │     │
│  └──────────────────────┘  └──────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/REST API
                           │
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                     │
│              (Node.js + Express.js)                     │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐               │
│  │  Routes  │→│Controllers │→│ Services │               │
│  └──────────┘ └────────────┘ └──────────┘               │
│       ↓              ↓            ↓                     │
│  ┌──────────────────────────────────────┐               │
│  │         Middleware Layer             │               │
│  │  (Auth, Token Refresh, Validation)   │               │
│  └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                          │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  MongoDB Atlas   │  │   SendGrid API   │             │
│  │  (Database)      │  │  (Email Service) │             │
│  └──────────────────┘  └──────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Design Patterns
- **MVC Architecture**: Separation of concerns with Models, Controllers, and Routes
- **Service Layer**: Business logic isolated in service modules
- **Middleware Pipeline**: Authentication, token refresh, and validation
- **RESTful API**: Resource-oriented endpoints with proper HTTP methods

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- MongoDB Atlas account
- SendGrid API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DexterPressley/CalZone.git
   cd CalZone
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=your_mongodb_atlas_connection_string
   
   # JWT Secret
   ACCESS_TOKEN_SECRET=your_jwt_secret_key_here
   
   # SendGrid Email Service
   SENDGRID_API_KEY=your_sendgrid_api_key
   EMAIL_USER=noreply@yourdomain.com
   
   # Application URL (for email links)
   APP_URL=http://localhost:3000
   ```

5. **Start the development servers**
   
   Backend:
   ```bash
   cd backend
   npm run dev
   ```
   
   Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Web App: `http://localhost:3000`
   - API Server: `http://localhost:5000`
   - API Documentation: `http://localhost:5000/api-docs`

## 📚 API Documentation

### Interactive Documentation
View the complete API documentation with interactive endpoints:

**[View on SwaggerHub](https://app.swaggerhub.com/apis/team10-4aa/CalZone/1.0.0/)**

### Local Documentation
The OpenAPI specification is also available in the repository:
- **File**: [`openapi.yaml`](./docs/api/openapi.yaml)
- **Local Viewer**: Access at `http://localhost:5000/api-docs` when running the server

### Quick API Overview

#### Authentication Endpoints
- `POST /api/register` - Create new user account
- `POST /api/login` - Authenticate and receive JWT token
- `POST /api/verify-email` - Verify email address
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password with token

#### User Settings
- `GET /api/users/:userId` - Get user profile
- `PATCH /api/users/:userId/calorie-goal` - Update calorie goal
- `PATCH /api/users/:userId/macro-goals` - Update macro goals

#### Foods Management
- `GET /api/users/:userId/foods` - List/search foods
- `POST /api/users/:userId/foods` - Create new food
- `PATCH /api/users/:userId/foods/:foodId` - Update food
- `DELETE /api/users/:userId/foods/:foodId` - Delete food

#### Daily Tracking
- `GET /api/users/:userId/days` - Get days with date range filtering
- `POST /api/users/:userId/days` - Create new day
- `GET /api/users/:userId/days/:dayId` - Get specific day with entries

#### Food Entries
- `POST /api/users/:userId/days/:dayId/entries` - Add food entry
- `PATCH /api/users/:userId/days/:dayId/entries/:entryId` - Update entry
- `DELETE /api/users/:userId/days/:dayId/entries/:entryId` - Delete entry

All protected endpoints require a Bearer token in the Authorization header and return a refreshed token in the `X-Refreshed-Token` response header.

## 📁 Project Structure

```
CalZone/
├── backend/
│   ├── controllers/           # Request handlers
│   │   ├── dayController.js
│   │   ├── entryController.js
│   │   ├── foodController.js
│   │   └── userController.js
│   ├── middleware/           # Express middleware
│   │   ├── authMiddleware.js
│   │   └── tokenRefresh.js
│   ├── models/              # Mongoose schemas
│   │   ├── day.js
│   │   ├── food.js
│   │   └── user.js
│   ├── routes/              # API routes
│   │   ├── dayRoutes.js
│   │   ├── entryRoutes.js
│   │   ├── foodRoutes.js
│   │   └── userRoutes.js
│   ├── services/            # Business logic & integrations
│   │   ├── emailService.js
│   │   └── jwtService.js
│   ├── .env                 # Environment variables (not in repo)
│   ├── package.json
│   └── server.js            # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API integration
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── mobile/                  # Flutter mobile app
│   ├── lib/
│   ├── android/
│   ├── ios/
│   └── pubspec.yaml
├── docs/
│   └── api/
│       └──openapi.yaml             # OpenAPI specification
└── README.md
```

## 🔐 Environment Variables

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port number | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/calzone` |
| `ACCESS_TOKEN_SECRET` | JWT signing secret | `your-secret-key-min-32-chars` |
| `SENDGRID_API_KEY` | SendGrid API key for emails | `SG.xxxxxxxxxxxxxxxx` |
| `EMAIL_USER` | Sender email address | `noreply@calzone.com` |
| `APP_URL` | Frontend URL for email links | `https://calzone.com` |

### Security Notes
- Never commit `.env` files to version control
- Use strong, randomly generated secrets for `ACCESS_TOKEN_SECRET`
- Rotate API keys regularly
- Use different credentials for development and production

## 🌐 Deployment

### Digital Ocean Deployment

CalZone is deployed on a Digital Ocean Droplet running Ubuntu 22.04 LTS:

**Production URL**: `https://colorsdigitalocean.xyz`

### Deployment Steps

1. **Server Setup**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Clone and Configure**
   ```bash
   git clone https://github.com/DexterPressley/CalZone.git
   cd CalZone/backend
   npm install --production
   ```

3. **Environment Configuration**
   - Create production `.env` file with production credentials
   - Update `APP_URL` to production domain
   - Configure MongoDB Atlas IP whitelist

4. **Start with PM2**
   ```bash
   pm2 start server.js --name calzone-api
   pm2 save
   pm2 startup
   ```

5. **Nginx Configuration** (Optional)
   ```nginx
   server {
       listen 80;
       server_name colorsdigitalocean.xyz;
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### MongoDB Atlas Configuration
- Database is hosted on MongoDB Atlas cloud
- Collections: `Users`, `Foods`, `Days`
- Indexes configured for optimal query performance
- Automatic backups enabled

## 👥 Contributing

This project was developed as part of COP 4331 at the University of Central Florida.

### Development Team
- **Project Lead**: Phat Huynh
- **Repository**: [github.com/DexterPressley/CalZone](https://github.com/DexterPressley/CalZone)

### Development Workflow

1. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the existing code style

3. Test your changes thoroughly

4. Commit with descriptive messages
   ```bash
   git commit -m "Add: Brief description of changes"
   ```

5. Push to your branch and create a Pull Request

### Code Style
- Backend: Follow Express.js best practices
- Use async/await for asynchronous operations
- Include error handling in all controllers
- Write descriptive comments for complex logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Course**: COP 4331 - Processes of Object-Oriented Software Development
- **Institution**: University of Central Florida
- **SendGrid**: Email delivery service
- **MongoDB Atlas**: Cloud database hosting
- **Digital Ocean**: Application hosting

## 📞 Contact & Support

For questions, issues, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/DexterPressley/CalZone/issues)
- **Repository**: [github.com/DexterPressley/CalZone](https://github.com/DexterPressley/CalZone)

---

**Built with ❤️ using the MERN stack + Flutter**