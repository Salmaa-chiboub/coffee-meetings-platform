# ☕ CoffeeMeet Frontend

A modern React application for HR managers to organize coffee meetings between employees, built with React, Tailwind CSS, and modern web technologies.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Backend server running on `http://localhost:8000`

### Setup
1. **Pull latest changes and navigate to frontend:**
   ```bash
   git pull origin main
   cd frontend/
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Place environment file:**
   ```bash
   # Place the .env file you received in the frontend/ directory
   ```

4. **Start development server:**
   ```bash
   npm start
   ```

5. **Open application:**
   Visit `http://localhost:3000`

## 📖 Full Setup Guide

For detailed setup instructions, troubleshooting, and environment configuration, see:
**[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)**

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Header, Sidebar, Layout
│   └── ui/             # Button, Input, etc.
├── contexts/           # React contexts (Auth)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services
└── utils/              # Utility functions
```

## 🎨 Features

- **Authentication System** - Login/Register with JWT
- **Profile Management** - HR manager profile and settings
- **Campaign Management** - Create and manage coffee meeting campaigns
- **Employee Management** - Import and manage employee data
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI** - Clean design with Tailwind CSS

## 🛠️ Technology Stack

- **React 18** - Frontend framework
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Heroicons** - Icon library
- **Axios** - HTTP client for API calls

## 📜 Available Scripts

### Development
```bash
npm start          # Start development server (http://localhost:3000)
npm test           # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

### Production
```bash
npm run build      # Create production build
npm run preview    # Preview production build locally
```

### Code Quality
```bash
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

## 🔧 Environment Variables

Required environment variables (you will receive the `.env` file):

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_FRONTEND_URL=http://localhost:3000
```

## 🤝 Development

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Maintain consistent file structure

### API Integration
- All API calls go through `src/services/api.js`
- Use proper error handling
- Implement loading states

## 📚 Learn More

- [React Documentation](https://reactjs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Create React App Documentation](https://create-react-app.dev/)

## 🐛 Troubleshooting

Common issues and solutions are documented in [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md#troubleshooting).

---

**Built with ❤️ for better workplace connections**
