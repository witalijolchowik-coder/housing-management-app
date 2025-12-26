/** @type {const} */
const themeColors = {
  // Primary accent - blue for toggles, active states
  primary: { light: '#6C8EEF', dark: '#6C8EEF' },
  
  // Backgrounds
  background: { light: '#121212', dark: '#121212' },
  surface: { light: '#1E1E2E', dark: '#1E1E2E' },
  surfaceVariant: { light: '#2A2A3A', dark: '#2A2A3A' },
  
  // Text colors
  foreground: { light: '#E8E8E8', dark: '#E8E8E8' },
  muted: { light: '#9BA1A6', dark: '#9BA1A6' },
  
  // Border
  border: { light: '#334155', dark: '#334155' },
  
  // Status colors
  success: { light: '#4ADE80', dark: '#4ADE80' },  // Free/Vacant - green
  warning: { light: '#FBBF24', dark: '#FBBF24' },  // Wypowiedzenie - yellow/orange
  error: { light: '#F87171', dark: '#F87171' },    // Conflict/Overdue - red
  
  // Additional status
  occupied: { light: '#6C8EEF', dark: '#6C8EEF' }, // Occupied - blue
  
  // Card backgrounds
  card: { light: '#1E1E2E', dark: '#1E1E2E' },
  cardHover: { light: '#252535', dark: '#252535' },
};

module.exports = { themeColors };
