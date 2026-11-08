export type SupportedLocale = 'pt' | 'en' | 'es';

export interface TranslationDictionary {
  locale: SupportedLocale;
  brand: {
    name: string;
    tagline: string;
  };
  login: {
    panelTitle: string;
    panelSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    submitButton: string;
    submittingButton: string;
    backToStore: string;
    secureAccess: string;
    copyright: string;
    invalidCredentials: string;
    emptyFields: string;
  };
  forgotModal: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    helpTextPrefix: string;
    helpTextHighlight: string;
    cancel: string;
    sendButton: string;
    sendingButton: string;
    successMessage: (email: string) => string;
    invalidEmail: string;
    genericError: string;
  };
  resetPassword: {
    pageTitle: string;
    heading: string;
    subheading: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    strengthLabel: string;
    strengthWeak: string;
    strengthMedium: string;
    strengthStrong: string;
    submitButton: string;
    submittingButton: string;
    successTitle: string;
    successMessage: string;
    goToLogin: string;
    backToLogin: string;
    encrypted: string;
    errorMinLength: string;
    errorMismatch: string;
    errorExpired: string;
    requestNewLink: string;
  };
  adminNav: {
    overview: string;
    orders: string;
    catalog: string;
    storeSettings: string;
    customers: string;
    finance: string;
    team: string;
    modules: string;
    settings: string;
  };
  adminHeader: {
    searchPlaceholder: string;
    openStore: string;
    storefront: string;
    posPin: string;
    logout: string;
    notifications: string;
    pendingOrders: (count: number) => string;
    noPendingOrders: string;
    viewAllOrders: string;
  };
  profile: {
    languageTitle: string;
    languageSubtitle: string;
    languageSaved: string;
  };
}
