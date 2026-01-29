# SIM Card Dashboard - README

## Project Structure

```
sim-dashboard/
├── server/                 # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Business logic
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── server.js      # Entry point
│   ├── .env               # Environment variables
│   └── package.json
│
├── src/                   # Frontend (React + TypeScript)
│   ├── components/        # Reusable components
│   │   ├── dashboard/    # Dashboard-specific widgets
│   │   └── layout/       # Layout components
│   ├── pages/            # Page components
│   │   ├── home/         # Dashboard page
│   │   ├── simcards/     # SIM cards management
│   │   └── reports/      # Reports & alerts
│   ├── services/         # API services
│   └── App.tsx           # Main app component
└── package.json
```

## Features

### Dashboard (Home Page)
- **Pool Utilization Widget**: Visual display of total data capacity vs. used
- **KPI Cards**: Total SIMs, Monthly Usage, Pool %, Active Alerts
- **Top Consumers Table**: Top 10 SIM cards by data usage
- **Auto-Refresh**: Updates every 5 minutes (configurable)
- **Manual Refresh**: Button to force refresh

### SIM Cards Management
- **List View**: Paginated table of all SIM cards
- **Search**: Filter by ICCID or MSISDN
- **Usage Percentage**: Color-coded chips (green/blue/warning/error)
- **Per-SIM Graphs**: Click any SIM to view hourly/daily usage history
- **Period Selection**: Last 24 hours, week, or month

### Reports & Alerts
- **Custom Report Builder**:
  - Date range selection
  - Group by: Raw data, Daily, or Monthly
  - Export to CSV
- **Alert Configuration**:
  - Customizable threshold (default 80%)
  - Real-time alert checking
  - List of SIMs exceeding threshold

## Setup Instructions

### Prerequisites
- Node.js v18+ 
- MySQL 8.0+
- npm or yarn

### Database Setup

1. Create the database:
```sql
CREATE DATABASE simcard_db;
USE simcard_db;
```

2. Create tables:
```sql
CREATE TABLE `assets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `iccid` varchar(50) NOT NULL,
  `CreatedTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_iccid` (`iccid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idAsset` int NOT NULL,
  `iccid` varchar(45) NOT NULL,
  `msisdn` varchar(45) NOT NULL,
  `dataSize` varchar(45) NOT NULL,
  `dataUsed` varchar(45) NOT NULL,
  `lastConnection` datetime DEFAULT NULL,
  `createdTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_iccid` (`iccid`),
  KEY `idx_createdTime` (`createdTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

3. (Optional) Add sample data for testing

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the server:
```bash
npm run dev
```

Server runs on: `http://localhost:5000`

### Frontend Setup

1. Navigate to project root:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Configure environment:
```bash
cp .env.example .env
# Verify REACT_APP_API_URL points to backend
```

4. Start development server:
```bash
npm start
```

Frontend runs on: `http://localhost:3000`

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats?threshold=0.8` - Get dashboard statistics
- `GET /api/dashboard/top-consumers?limit=10&period=month` - Get top consumers

### SIM Cards
- `GET /api/sims?page=1&limit=20&search=` - List SIM cards
- `GET /api/sims/:iccid/history?period=week&groupBy=hour` - Get SIM usage history

### Reports
- `POST /api/reports/custom` - Generate custom report
- `GET /api/reports/alerts?threshold=0.8` - Get active alerts

## Configuration

### Auto-Refresh Interval
Edit in `src/pages/home/index.tsx`:
```typescript
const interval = setInterval(() => {
  fetchData();
}, 5 * 60 * 1000); // Change 5 to desired minutes
```

### Default Alert Threshold
Edit in backend controllers or frontend:
```javascript
const alertThreshold = 0.8; // 80%
```

### Pagination Limits
Edit in `src/pages/simcards/index.tsx`:
```typescript
const [rowsPerPage, setRowsPerPage] = useState(20);
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Update database credentials
3. Use process manager (PM2):
```bash
npm install -g pm2
pm2 start src/server.js --name sim-api
```

### Frontend
1. Build for production:
```bash
npm run build
```
2. Serve static files (Nginx, Apache, or CDN)

## Troubleshooting

### Database Connection Failed
- Verify MySQL is running
- Check credentials in `server/.env`
- Ensure database exists

### CORS Errors
- Verify `CORS_ORIGIN` in backend `.env`
- Check `REACT_APP_API_URL` in frontend `.env`

### No Data Showing
- Verify backend is running on port 5000
- Check browser console for errors
- Ensure database has data in `assets` and `Data` tables

## Development Roadmap

### Week 1 (Completed)
- ✅ Backend API setup
- ✅ Dashboard with Pool Utilization
- ✅ Top Consumers widget
- ✅ Auto-refresh functionality

### Week 2 (In Progress)
- ✅ SIM cards list page
- ✅ Per-SIM usage graphs
- ✅ Custom report builder
- ✅ Alert configuration
- ⏳ Authentication (optional)
- ⏳ Real-time WebSocket updates

## Tech Stack

- **Frontend**: React 18, TypeScript, Material-UI, MUI X-Charts, Axios
- **Backend**: Node.js, Express, MySQL2
- **Tools**: React Router, ESLint, Prettier

## License

MIT

## Support

For issues or questions, contact your development team.
