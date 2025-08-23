# Anomalías Dashboard - Enhanced Features

## Overview

The Anomalías Dashboard has been completely redesigned with professional Material-UI components and enhanced functionality for better user experience and data visualization.

## New Features

### 🎯 Interactive Client Anomalies Pie Chart

- **Professional Design**: Uses Recharts library for smooth, interactive pie charts
- **Click-to-Filter**: Click on any client segment to automatically apply that client filter to all charts and tables
- **Color-coded**: Each client has a unique color for easy identification
- **Tooltips**: Hover over segments to see detailed information
- **Responsive**: Adapts to different screen sizes

### 📊 Enhanced Event Categories Chart

- **Professional Visualization**: Clean pie chart showing distribution of anomaly types
- **Category Mapping**:
  - ENA: Estadia no autorizada
  - FM: Falla mecánica
  - ONC: Usuario no responde
  - DR: Desvío de ruta
- **Interactive Elements**: Hover tooltips with percentages

### 📈 ONC Events Analysis

- **Dual View Modes**:
  - Bar Chart: Visual representation of "Usuario No Responde" events
  - List View: Detailed table with percentages
- **Toggle Controls**: Easy switching between chart and list views
- **Color-coded Bars**: Each event type has its own color

### 🔍 Advanced Filtering System

- **Material-UI Components**: Professional form controls
- **Real-time Filtering**: Apply filters to all charts and tables simultaneously
- **Filter Indicators**: Visual badges show when filters are active
- **Reset Functionality**: One-click filter reset

### 📋 Enhanced Data Table

- **Material-UI Table**: Professional table with hover effects
- **Pagination**: Navigate through large datasets efficiently
- **Status Indicators**: Color-coded chips for different statuses
- **Anomaly Tags**: Visual chips for different anomaly types
- **Export Functionality**: Download filtered data as Excel

### 🎨 Professional Design

- **Material-UI Theme**: Consistent, modern design language
- **Gradient Cards**: Beautiful gradient backgrounds
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Loading States**: Professional loading indicators
- **Empty States**: Helpful messages when no data is available

## Technical Implementation

### Dependencies Added

```json
{
  "@emotion/react": "^11.11.3",
  "@emotion/styled": "^11.11.0",
  "@mui/icons-material": "^5.15.10",
  "@mui/material": "^5.15.10",
  "recharts": "^2.10.4"
}
```

### Backend Endpoints

- `GET /dashboard/client-anomalias-stats` - Returns client anomalies statistics
- Enhanced existing endpoints with better filtering

### Key Components

- **Recharts Integration**: Professional charting library
- **Material-UI**: Modern React component library
- **Responsive Design**: Mobile-first approach
- **State Management**: Efficient React hooks usage

## Usage Instructions

### Filtering Data

1. Use the filter panel at the top to select date ranges, clients, transport lines, and operators
2. Click "Aplicar" to apply filters to all charts and tables
3. Click the refresh icon to reset all filters

### Interactive Charts

1. **Client Pie Chart**: Click on any client segment to filter by that client
2. **Event Categories**: Hover over segments to see detailed information
3. **ONC Events**: Toggle between chart and list views using the buttons

### Data Export

1. Apply desired filters
2. Click "Exportar Excel" button in the anomalies table
3. File will be downloaded with current date in filename

### Table Navigation

1. Use pagination controls at the bottom of the table
2. Adjust rows per page as needed
3. Hover over table rows for better visibility

## Performance Features

- **Memoized Calculations**: Efficient data processing
- **Lazy Loading**: Charts load only when needed
- **Optimized Queries**: Backend aggregation for fast data retrieval
- **Responsive Images**: Optimized for different screen sizes

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- Real-time data updates
- Advanced analytics
- Custom date range picker
- Export to PDF functionality
- Drill-down capabilities
- Comparative analysis tools
