export type SupportedLocale = 'pt' | 'en' | 'es';

export interface CommonTranslations {
  save: string;
  saving: string;
  cancel: string;
  edit: string;
  delete: string;
  search: string;
  filter: string;
  clear: string;
  actions: string;
  status: string;
  loading: string;
  success: string;
  error: string;
  back: string;
  all: string;
  active: string;
  inactive: string;
  exportCsv: string;
  confirm: string;
  close: string;
  copy: string;
  copied: string;
  details: string;
  yes: string;
  no: string;
  new: string;
  selectOption: string;
}

export interface DashboardTranslations {
  title: string;
  subtitle: string;
  totalRevenue: string;
  grossSales: string;
  netProfit: string;
  totalOrders: string;
  pendingOrders: string;
  averageTicket: string;
  itemsSold: string;
  recentOrders: string;
  noRecentOrders: string;
  revenueChart: string;
  quickActions: string;
  quickNewProduct: string;
  quickViewOrders: string;
  quickPos: string;
  quickStorefront: string;
  filterLast7Days: string;
  filterLast30Days: string;
  filterMonth: string;
  filterYear: string;
  growthVsPrevious: string;
}

export interface OrdersTranslations {
  title: string;
  subtitle: string;
  tabAll: string;
  tabPending: string;
  tabWaitingWhatsapp: string;
  tabPaid: string;
  tabShipped: string;
  tabDelivered: string;
  tabCanceled: string;
  searchPlaceholder: string;
  colOrder: string;
  colCustomer: string;
  colDate: string;
  colItems: string;
  colTotal: string;
  colStatus: string;
  colPayment: string;
  colActions: string;
  orderDetails: string;
  customerData: string;
  shippingAddress: string;
  itemsPurchased: string;
  subtotal: string;
  shippingCost: string;
  discount: string;
  total: string;
  notifyCustomer: string;
  markAsPaid: string;
  markAsShipped: string;
  markAsDelivered: string;
  cancelOrder: string;
  trackingCode: string;
  addTracking: string;
}

export interface ProductsTranslations {
  title: string;
  subtitle: string;
  newProduct: string;
  searchPlaceholder: string;
  filterCategory: string;
  filterStatus: string;
  filterStock: string;
  inStock: string;
  lowStock: string;
  outOfStock: string;
  colPhoto: string;
  colName: string;
  colSku: string;
  colCategory: string;
  colPrice: string;
  colPromoPrice: string;
  colStock: string;
  colStatus: string;
  colActions: string;
  basicInfo: string;
  productName: string;
  productDesc: string;
  category: string;
  pricing: string;
  costPrice: string;
  markup: string;
  mediaGallery: string;
  variations: string;
  sizeGrid: string;
  colors: string;
  manageStock: string;
}

export interface CustomersTranslations {
  title: string;
  subtitle: string;
  totalCustomers: string;
  vipCustomers: string;
  repeatCustomers: string;
  averageLtv: string;
  searchPlaceholder: string;
  colName: string;
  colPhone: string;
  colEmail: string;
  colOrders: string;
  colTotalSpent: string;
  colLastPurchase: string;
  colTag: string;
  customerProfile: string;
  purchaseHistory: string;
  serviceNotes: string;
  tagVip: string;
  tagRecurring: string;
  tagLead: string;
}

export interface FinanceTranslations {
  title: string;
  subtitle: string;
  grossRevenue: string;
  cmv: string;
  operatingExpenses: string;
  netProfit: string;
  netMargin: string;
  averageTicket: string;
  itemsSold: string;
  dreSummary: string;
  profitabilityByProduct: string;
  exportReport: string;
}

export interface TeamTranslations {
  title: string;
  subtitle: string;
  inviteMember: string;
  roleOwner: string;
  roleManager: string;
  roleSeller: string;
  roleStockist: string;
  colName: string;
  colRole: string;
  colEmail: string;
  colPhone: string;
  colStatus: string;
  colPosPin: string;
  auditLogs: string;
}

export interface StoreSettingsTranslations {
  title: string;
  subtitle: string;
  generalData: string;
  storeName: string;
  legalName: string;
  taxId: string;
  stateRegistration: string;
  webAddress: string;
  customDomain: string;
  defaultCurrency: string;
  currencyDesc: string;
  contactChannels: string;
  whatsappOfficial: string;
  contactEmail: string;
  businessHours: string;
  address: string;
  postalCode: string;
  policiesAndTerms: string;
  returnPolicy: string;
  privacyPolicy: string;
  termsOfUse: string;
}

export interface WhatsAppTemplates {
  orderApproved: (storeName: string, orderNumber: string, customerName: string) => string;
  orderShipped: (storeName: string, orderNumber: string, customerName: string, trackingCode?: string) => string;
  orderDelivered: (storeName: string, orderNumber: string, customerName: string) => string;
}

export interface TranslationDictionary {
  locale: SupportedLocale;
  brand: {
    name: string;
    tagline: string;
  };
  common: CommonTranslations;
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
  dashboard: DashboardTranslations;
  orders: OrdersTranslations;
  products: ProductsTranslations;
  customers: CustomersTranslations;
  finance: FinanceTranslations;
  team: TeamTranslations;
  storeSettings: StoreSettingsTranslations;
  whatsappTemplates: WhatsAppTemplates;
}
