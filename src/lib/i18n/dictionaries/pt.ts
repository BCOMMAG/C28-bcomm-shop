import { TranslationDictionary } from '../types';

export const pt: TranslationDictionary = {
  locale: 'pt',
  brand: {
    name: 'BCOMM',
    tagline: 'Plataforma de E-commerce & Gestão'
  },
  login: {
    panelTitle: 'Painel Administrativo da Loja',
    panelSubtitle: 'Informe suas credenciais para gerenciar a loja',
    emailLabel: 'E-mail de Acesso',
    emailPlaceholder: 'seu.email@loja.com.br',
    passwordLabel: 'Senha de Acesso',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Esqueci minha senha',
    submitButton: 'Entrar no Painel',
    submittingButton: 'Autenticando...',
    backToStore: 'Voltar para a Loja',
    secureAccess: 'Acesso Criptografado',
    copyright: '© 2026 BCOMM • Todos os direitos reservados.',
    invalidCredentials: 'E-mail ou senha incorretos. Verifique suas credenciais de acesso.',
    emptyFields: 'Por favor, preencha o e-mail e a senha.'
  },
  forgotModal: {
    title: 'Recuperação de Senha',
    subtitle: 'Insira seu e-mail cadastrado para redefinir o acesso',
    emailLabel: 'E-mail da Loja',
    emailPlaceholder: 'admin@sualoja.com.br',
    helpTextPrefix: 'O link de redefinição será enviado pelo remetente oficial',
    helpTextHighlight: 'security@agent-bcomm.space',
    cancel: 'Cancelar',
    sendButton: 'Enviar E-mail',
    sendingButton: 'Enviando e-mail...',
    successMessage: (email: string) =>
      `Enviamos as instruções com o link de redefinição para ${email}. O remetente oficial é security@agent-bcomm.space. Verifique sua caixa de entrada e pasta de spam.`,
    invalidEmail: 'Por favor, informe um endereço de e-mail válido.',
    genericError: 'Não foi possível processar a recuperação. Tente novamente mais tarde.'
  },
  resetPassword: {
    pageTitle: 'BCOMM • Redefinição de Senha',
    heading: 'Redefinição de Senha',
    subheading: 'Crie uma nova credencial segura para acessar o Painel da Loja',
    newPasswordLabel: 'Nova Senha',
    newPasswordPlaceholder: 'Mínimo 8 caracteres',
    confirmPasswordLabel: 'Confirmar Nova Senha',
    confirmPasswordPlaceholder: 'Repita a nova senha',
    strengthLabel: 'Força da senha:',
    strengthWeak: 'Fraca',
    strengthMedium: 'Boa',
    strengthStrong: 'Excelente',
    submitButton: 'Confirmar Nova Senha',
    submittingButton: 'Atualizando...',
    successTitle: 'Senha Redefinida com Sucesso!',
    successMessage: 'Sua nova senha de acesso foi atualizada e já está ativa para login.',
    goToLogin: 'Ir para o Login',
    backToLogin: '← Voltar ao Login',
    encrypted: 'Redefinição Criptografada',
    errorMinLength: 'A nova senha deve possuir no mínimo 8 caracteres.',
    errorMismatch: 'As senhas digitadas não coincidem.',
    errorExpired: 'Link de recuperação inválido ou expirado. Por favor, solicite um novo link.',
    requestNewLink: 'Solicitar Novo Link'
  }
};
