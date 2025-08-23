# Build Optimization Guide

This guide explains the optimizations implemented to make the client build faster and lighter.

## 🚀 Build Optimizations Implemented

### 1. **Chunk Splitting**
- **Vendor chunks**: Separated large libraries into individual chunks for better caching
- **Dynamic imports**: Libraries are loaded only when needed
- **Better caching**: Browser can cache vendor chunks separately

### 2. **Tree Shaking**
- **ES2015 target**: Enables better tree shaking
- **Unused code removal**: Dead code is eliminated from the final bundle
- **Import optimization**: Only used parts of libraries are included

### 3. **Minification**
- **Terser**: Advanced JavaScript minification
- **Console removal**: All console statements are removed in production
- **Debugger removal**: Debugger statements are stripped
- **Mangling**: Variable names are shortened

### 4. **Asset Optimization**
- **CSS splitting**: Styles are split into separate files
- **Image optimization**: Images are organized in dedicated folders
- **Hash-based naming**: Cache-busting with content hashes

### 5. **Development Optimizations**
- **HMR overlay disabled**: Faster hot module replacement
- **Dependency pre-bundling**: Common dependencies are pre-bundled
- **Excluded heavy libraries**: Large libraries excluded from dev builds

## 📦 Available Build Commands

```bash
# Standard build
npm run build

# Production build with optimizations
npm run build:prod

# Clean build directory
npm run clean

# Development server
npm run dev
```

## 🎯 Bundle Analysis

To analyze your bundle size:

1. Install bundle analyzer:
```bash
npm install --save-dev rollup-plugin-visualizer
```

2. Add to vite.config.js:
```javascript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
    }),
  ],
  // ... rest of config
});
```

## 🔧 Additional Optimizations

### Code Splitting
```javascript
// Lazy load components
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const AnomaliasDashboardPage = lazy(() => import('./components/AnomaliasDashboardPage'));
```

### Dynamic Imports
```javascript
// Load heavy libraries only when needed
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js');
  return Chart;
};
```

### Image Optimization
- Use WebP format when possible
- Implement lazy loading for images
- Use appropriate image sizes

### CSS Optimization
- Remove unused CSS
- Use CSS-in-JS for component-specific styles
- Minimize CSS bundle size

## 📊 Performance Monitoring

### Bundle Size Targets
- **Initial bundle**: < 500KB
- **Vendor chunks**: < 200KB each
- **Total bundle**: < 2MB

### Build Time Targets
- **Development**: < 3 seconds
- **Production**: < 30 seconds

## 🛠️ Troubleshooting

### Large Bundle Size
1. Check for duplicate dependencies
2. Analyze bundle with visualizer
3. Implement code splitting
4. Remove unused dependencies

### Slow Build Times
1. Exclude heavy libraries from dev builds
2. Use dependency pre-bundling
3. Optimize Vite configuration
4. Consider using esbuild for faster builds

### Memory Issues
1. Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
2. Use production builds for testing
3. Clean build cache regularly

## 📈 Best Practices

1. **Regular audits**: Run bundle analysis monthly
2. **Dependency management**: Keep dependencies updated
3. **Code splitting**: Split routes and heavy components
4. **Tree shaking**: Use ES modules and avoid side effects
5. **Caching**: Implement proper cache strategies
6. **Monitoring**: Track bundle size over time

## 🔄 Continuous Optimization

- Monitor bundle size in CI/CD
- Set up automated bundle analysis
- Regular dependency updates
- Performance budget enforcement
- User experience monitoring
