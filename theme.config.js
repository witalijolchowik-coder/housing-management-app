/** @type {const} */
const themeColors = {
  // Primary - Modern blue (Material Design 3)
  primary: { light: '#5B9EFF', dark: '#5B9EFF' },
  
  // Backgrounds - Deep dark for dark theme
  background: { light: '#0F0F1A', dark: '#0F0F1A' },
  surface: { light: '#1A1A2E', dark: '#1A1A2E' },
  surfaceVariant: { light: '#252540', dark: '#252540' },
  
  // Text colors - High contrast
  foreground: { light: '#F5F5F7', dark: '#F5F5F7' },
  muted: { light: '#8B92A0', dark: '#8B92A0' },
  
  // Border - Subtle dividers
  border: { light: '#2D2D42', dark: '#2D2D42' },
  
  // Status colors - Material Design 3
  success: { light: '#4ADE80', dark: '#4ADE80' },      // Free/Vacant - green
  warning: { light: '#FFB84D', dark: '#FFB84D' },      // Wypowiedzenie - amber
  error: { light: '#FF6B6B', dark: '#FF6B6B' },        // Conflict/Overdue - red
  
  // Additional status
  occupied: { light: '#5B9EFF', dark: '#5B9EFF' },     // Occupied - blue
  
  // Card backgrounds
  card: { light: '#1A1A2E', dark: '#1A1A2E' },
  cardHover: { light: '#252540', dark: '#252540' },
};

module.exports = { themeColors };
