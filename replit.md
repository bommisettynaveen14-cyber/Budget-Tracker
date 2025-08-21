# Budget Tracker PWA

## Overview

Budget Tracker is a comprehensive offline-first Progressive Web Application (PWA) designed for personal finance management. The application allows users to track their income and expenses, categorize transactions, set budgets, and visualize their financial data through charts and analytics. Built with vanilla JavaScript, HTML, and CSS, it operates entirely offline using localStorage for data persistence and includes service worker implementation for PWA capabilities.

## Recent Changes (August 2025)

✓ **Enhanced Filtering System**: Added monthly and custom date range filtering with automatic month updates (current + 12 future + 12 past months)
✓ **Daily Totals Redesign**: Completely separated income and expense displays with individual category breakdowns
✓ **Category Management**: Shows total amounts spent/earned per category, not just transaction counts  
✓ **Monthly Overview**: Added category-wise spending summaries in Categories tab
✓ **Cache Management**: Implemented proper cache-busting for seamless updates
✓ **Improved UI**: Enhanced visual distinction between income (green) and expenses (red) with dedicated sections

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla JavaScript using a class-based architecture (`BudgetTracker` class)
- **Component-based UI**: Modular tab-based navigation system with dynamic content rendering
- **Progressive Web App**: Implements PWA standards with manifest.json and service worker for offline functionality
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox for cross-device compatibility

### Data Management
- **Local Storage**: All data persistence handled through browser's localStorage API
- **Data Structure**: Centralized data object containing transactions, categories, budgets, and user settings
- **State Management**: In-memory state management with localStorage synchronization
- **Data Validation**: Client-side validation for all user inputs and data integrity checks

### User Interface Components
- **Multi-language Support**: Built-in internationalization system supporting English and Hindi
- **Theme System**: Dynamic light/dark theme switching with system preference detection
- **Navigation**: Tab-based navigation with active state management
- **Forms**: Dynamic form generation and validation for transactions and categories
- **Charts**: Integration with Chart.js library for data visualization

### Offline Capabilities
- **Service Worker**: Comprehensive caching strategy for complete offline functionality
- **Cache Management**: Static and dynamic cache handling with versioning
- **Offline-first Design**: Application functions fully without internet connectivity
- **Data Synchronization**: All operations work entirely with local data storage

### Core Features
- **Transaction Management**: CRUD operations for income and expense tracking
- **Category System**: Customizable transaction categories with budget allocation
- **Dashboard Analytics**: Real-time financial summaries and insights
- **Time-based Filtering**: Support for various time ranges and monthly views
- **Data Export/Import**: JSON-based data backup and restore functionality

## External Dependencies

### JavaScript Libraries
- **Chart.js (v4.4.0)**: Loaded via CDN for creating interactive charts and data visualizations
  - Used for category-wise pie charts and monthly bar charts
  - Provides offline chart rendering capabilities once loaded

### Browser APIs
- **localStorage API**: Primary data persistence mechanism
- **Service Worker API**: Enables PWA functionality and offline caching
- **Notification API**: For daily reminders and app notifications
- **Geolocation API**: Optional location tracking for transactions

### PWA Infrastructure
- **Web App Manifest**: Defines app metadata, icons, and installation behavior
- **Service Worker**: Handles caching strategies and offline functionality
- **Cache API**: Manages static and dynamic resource caching

### Development Tools
- **CSS Custom Properties**: For dynamic theming and design consistency
- **ES6+ Features**: Modern JavaScript features including classes, arrow functions, and template literals
- **Intersection Observer API**: For performance optimization and lazy loading

The application is designed to be deployment-ready for static hosting services like GitHub Pages and Netlify, and can be packaged into mobile applications using tools like Kodular or Thunkable while maintaining full offline functionality.