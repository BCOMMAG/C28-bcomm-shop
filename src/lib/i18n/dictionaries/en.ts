import { TranslationDictionary } from '../types';

export const en: TranslationDictionary = {
  locale: 'en',
  brand: {
    name: 'BCOMM',
    tagline: 'E-commerce & Store Management Platform'
  },
  login: {
    panelTitle: 'Store Admin Dashboard',
    panelSubtitle: 'Enter your credentials to manage the store',
    emailLabel: 'Account Email',
    emailPlaceholder: 'your.email@store.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Forgot password?',
    submitButton: 'Sign in to Dashboard',
    submittingButton: 'Authenticating...',
    backToStore: 'Back to Store',
    secureAccess: 'Encrypted Access',
    copyright: '© 2026 BCOMM • All rights reserved.',
    invalidCredentials: 'Incorrect email or password. Please verify your credentials.',
    emptyFields: 'Please enter both email and password.'
  },
  forgotModal: {
    title: 'Password Recovery',
    subtitle: 'Enter your registered business email to reset access',
    emailLabel: 'Store Email',
    emailPlaceholder: 'admin@yourstore.com',
    helpTextPrefix: 'The reset link will be sent from our official sender',
    helpTextHighlight: 'security@agent-bcomm.space',
    cancel: 'Cancel',
    sendButton: 'Send Reset Email',
    sendingButton: 'Sending email...',
    successMessage: (email: string) =>
      `We sent reset instructions to ${email}. The official sender is security@agent-bcomm.space. Please check your inbox and spam folder.`,
    invalidEmail: 'Please enter a valid email address.',
    genericError: 'Unable to process password reset. Please try again later.'
  },
  resetPassword: {
    pageTitle: 'BCOMM • Password Reset',
    heading: 'Password Reset',
    subheading: 'Create a new secure password to access your Store Dashboard',
    newPasswordLabel: 'New Password',
    newPasswordPlaceholder: 'Minimum 8 characters',
    confirmPasswordLabel: 'Confirm New Password',
    confirmPasswordPlaceholder: 'Repeat your new password',
    strengthLabel: 'Password strength:',
    strengthWeak: 'Weak',
    strengthMedium: 'Good',
    strengthStrong: 'Strong',
    submitButton: 'Confirm New Password',
    submittingButton: 'Updating...',
    successTitle: 'Password Successfully Reset!',
    successMessage: 'Your new access password has been updated and is now active for login.',
    goToLogin: 'Proceed to Login',
    backToLogin: '← Back to Login',
    encrypted: 'Encrypted Reset',
    errorMinLength: 'Password must be at least 8 characters long.',
    errorMismatch: 'Passwords do not match.',
    errorExpired: 'Recovery link is invalid or has expired. Please request a new link.',
    requestNewLink: 'Request New Link'
  },
  adminNav: {
    overview: 'Overview',
    orders: 'Orders',
    catalog: 'Catalog & Stock',
    storeSettings: 'Store Settings',
    customers: 'Customers & CRM',
    finance: 'Finance',
    team: 'Team & Access',
    modules: 'App Store',
    settings: 'General Settings'
  },
  adminHeader: {
    searchPlaceholder: 'Search items, orders or customers...',
    openStore: 'Open Storefront',
    storefront: 'Storefront',
    posPin: 'POS (PIN)',
    logout: 'Sign out',
    notifications: 'Operational Notifications',
    pendingOrders: (count: number) => `${count} pending`,
    noPendingOrders: 'No pending orders at the moment.',
    viewAllOrders: 'View all orders →'
  },
  profile: {
    languageTitle: 'Dashboard Preferred Language',
    languageSubtitle: 'Select the language used across the dashboard and notifications',
    languageSaved: 'Dashboard language successfully updated!'
  }
};
