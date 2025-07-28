import { toast } from "@/components/ui/use-toast";

export const handleSupabaseError = (error, context = 'operation') => {
  console.error(`Supabase Error (${context}):`, error);
  
  let title = 'Erro';
  let description = 'Ocorreu um erro inesperado.';
  
  if (error.code === '42501') {
    title = 'Permissão necessária';
    description = 'Você não tem permissão para realizar esta ação. Por favor, faça login.';
  } else if (error.code === 'PGRST116') {
    // No rows found
    return null; // Let the calling code handle this case
  } else if (error.message) {
    description = error.message;
  }
  
  toast({
    title,
    description,
    variant: 'destructive',
  });
  
  return error;
};

export const withErrorHandling = (fn, context) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleSupabaseError(error, context);
    }
  };
};
