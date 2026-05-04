export const response = {
  ok: (data: any, message = "Sucesso") => ({
    success: true,
    message,
    data,
  }),

  created: (data: any, message = "Criado com sucesso") => ({
    success: true,
    message,
    data,
  }),

  noContent: () => null,
};