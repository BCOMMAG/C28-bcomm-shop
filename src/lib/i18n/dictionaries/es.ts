import { TranslationDictionary } from '../types';

export const es: TranslationDictionary = {
  locale: 'es',
  brand: {
    name: 'BCOMM',
    tagline: 'Plataforma de E-commerce y Gestión'
  },
  login: {
    panelTitle: 'Panel Administrativo de la Tienda',
    panelSubtitle: 'Ingrese sus credenciales para administrar la tienda',
    emailLabel: 'Correo de Acceso',
    emailPlaceholder: 'su.correo@tienda.com',
    passwordLabel: 'Contraseña de Acceso',
    passwordPlaceholder: '••••••••',
    forgotPassword: '¿Olvidó su contraseña?',
    submitButton: 'Entrar al Panel',
    submittingButton: 'Autenticando...',
    backToStore: 'Volver a la Tienda',
    secureAccess: 'Acceso Encriptado',
    copyright: '© 2026 BCOMM • Todos os direitos reservados.',
    invalidCredentials: 'Correo o contraseña incorrectos. Verifique sus credenciales.',
    emptyFields: 'Por favor, complete el correo y la contraseña.'
  },
  forgotModal: {
    title: 'Recuperación de Contraseña',
    subtitle: 'Ingrese su correo registrado para restablecer el acceso',
    emailLabel: 'Correo de la Tienda',
    emailPlaceholder: 'admin@sutienda.com',
    helpTextPrefix: 'El enlace de restablecimiento será enviado por el remitente oficial',
    helpTextHighlight: 'security@agent-bcomm.space',
    cancel: 'Cancelar',
    sendButton: 'Enviar Correo',
    sendingButton: 'Enviando correo...',
    successMessage: (email: string) =>
      `Hemos enviado las instrucciones con el enlace de restablecimiento a ${email}. El remitente oficial es security@agent-bcomm.space. Revise su bandeja de entrada y correo no deseado.`,
    invalidEmail: 'Por favor, ingrese una dirección de correo válida.',
    genericError: 'No fue posible procesar la recuperación. Inténtelo más tarde.'
  },
  resetPassword: {
    pageTitle: 'BCOMM • Restablecimiento de Contraseña',
    heading: 'Restablecimiento de Contraseña',
    subheading: 'Cree una nueva credencial segura para acceder al Panel de la Tienda',
    newPasswordLabel: 'Nueva Contraseña',
    newPasswordPlaceholder: 'Mínimo 8 caracteres',
    confirmPasswordLabel: 'Confirmar Nueva Contraseña',
    confirmPasswordPlaceholder: 'Repita a nueva senha',
    strengthLabel: 'Fuerza de la contraseña:',
    strengthWeak: 'Débil',
    strengthMedium: 'Buena',
    strengthStrong: 'Excelente',
    submitButton: 'Confirmar Nueva Contraseña',
    submittingButton: 'Actualizando...',
    successTitle: '¡Contraseña Restablecida con Éxito!',
    successMessage: 'Su nueva contraseña de acceso ha sido actualizada y ya está activa para iniciar sesión.',
    goToLogin: 'Ir al Inicio de Sesión',
    backToLogin: '← Volver al Inicio de Sesión',
    encrypted: 'Restablecimiento Encriptado',
    errorMinLength: 'La nueva contraseña debe tener al menos 8 caracteres.',
    errorMismatch: 'Las contraseñas no coinciden.',
    errorExpired: 'El enlace de recuperación es inválido o ha caducado. Solicite un nuevo enlace.',
    requestNewLink: 'Solicitar Nuevo Enlace'
  },
  adminNav: {
    overview: 'Visión General',
    orders: 'Pedidos',
    catalog: 'Catálogo y Stock',
    storeSettings: 'Configuración de la Tienda',
    customers: 'Clientes y CRM',
    finance: 'Finanzas',
    team: 'Equipo y Accesos',
    modules: 'Tienda de Módulos',
    settings: 'Configuraciones Generales'
  },
  adminHeader: {
    searchPlaceholder: 'Buscar artículos, pedidos o clientes...',
    openStore: 'Abrir Tienda',
    storefront: 'Tienda',
    posPin: 'Mostrador (PIN)',
    logout: 'Salir',
    notifications: 'Notificaciones Operativas',
    pendingOrders: (count: number) => `${count} pendiente(s)`,
    noPendingOrders: 'No hay pedidos pendientes en este momento.',
    viewAllOrders: 'Ver todos los pedidos →'
  },
  profile: {
    languageTitle: 'Idioma de Preferencia del Panel',
    languageSubtitle: 'Seleccione el idioma utilizado en el panel administrativo y notificaciones',
    languageSaved: '¡Idioma del panel actualizado con éxito!'
  }
};
