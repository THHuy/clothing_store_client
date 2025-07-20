// Theme configuration for Ant Design
export const theme = {
  token: {
    // Primary colors
    colorPrimary: '#D04925', // Earth orange
    colorSuccess: '#1E4D40', // Moss green
    colorWarning: '#F28C28', // Hover/CTA orange
    colorError: '#A31E22', // Lipstick red
    
    // Background colors
    colorBgLayout: '#FAF3E0', // Light yellow background
    colorBgContainer: '#F5E6C8', // Paper beige
    colorBgElevated: '#FFFFFF',
    
    // Text colors
    colorText: '#2B2B2B', // Main text
    colorTextSecondary: '#6E6E6E', // Secondary text
    colorTextTertiary: '#999999',
    
    // Border and divider
    colorBorder: '#E5D5B7',
    colorSplit: '#E5D5B7',
    
    // Component specific
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 64,
      siderBg: '#FFFFFF',
    },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemSelectedBg: '#F28C28',
      itemSelectedColor: '#FFFFFF',
      itemHoverBg: '#FFF7E6',
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Card: {
      headerBg: 'transparent',
    },
  },
};
