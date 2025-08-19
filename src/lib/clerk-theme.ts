import { Appearance } from '@clerk/types'

export const clerkTheme: Appearance = {
  elements: {
    // Form elements
    formButtonPrimary: 
      "bg-emerald-600 hover:bg-emerald-700 text-white text-sm normal-case font-medium transition-colors duration-200",
    
    // Card styling
    card: "shadow-lg border border-gray-200 rounded-lg bg-white",
    
    // Header styling
    headerTitle: "text-gray-900 font-bold",
    headerSubtitle: "text-gray-600",
    
    // Social buttons
    socialButtonsBlockButton: 
      "border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors duration-200",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    
    // Form fields
    formFieldLabel: "text-gray-700 font-medium",
    formFieldInput: 
      "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 transition-colors duration-200",
    formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700",
    
    // Links and actions
    footerActionLink: "text-emerald-600 hover:text-emerald-700 font-medium",
    identityPreviewText: "text-gray-700",
    identityPreviewEditButton: "text-emerald-600 hover:text-emerald-700",
    
    // Navigation (for UserProfile)
    navbarButton: "text-gray-700 hover:text-emerald-600 transition-colors duration-200",
    navbarButtonActive: "text-emerald-600 border-emerald-600",
    
    // Profile sections
    profileSectionTitle: "text-gray-900 font-semibold",
    profileSectionContent: "text-gray-700",
    
    // Alerts and messages
    alertText: "text-gray-700",
    
    // Loading states
    spinner: "text-emerald-600",
    
    // Dividers
    dividerLine: "bg-gray-200",
    dividerText: "text-gray-500",
  },
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "#059669", // emerald-600
    colorSuccess: "#10b981", // emerald-500
    colorWarning: "#f59e0b", // amber-500
    colorDanger: "#ef4444", // red-500
    colorNeutral: "#6b7280", // gray-500
    colorText: "#111827", // gray-900
    colorTextSecondary: "#6b7280", // gray-500
    colorBackground: "#ffffff", // white
    colorInputBackground: "#ffffff", // white
    colorInputText: "#111827", // gray-900
    borderRadius: "0.5rem", // rounded-lg
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "0.875rem", // text-sm
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
}