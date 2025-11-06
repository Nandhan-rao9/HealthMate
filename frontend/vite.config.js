// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Import the 'path' module from node
import path from 'path'; 

export default defineConfig({
  plugins: [react()],
  
  // This step is critical to resolve the duplicate React dependency issue
  resolve: {
    alias: {
      // Use path.resolve() to get a fully qualified, absolute path
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      // Add the other aliases Vite warned about for completeness
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
  },

  // This block can actually be removed or simplified, 
  // as the alias fix is usually enough to stop the duplication.
  optimizeDeps: {
    // You can usually omit this now that the aliases are absolute.
    // If you keep it, ensure it's correct:
    include: ['react', 'react-dom'], 
  },
});