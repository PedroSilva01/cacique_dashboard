
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Edit, Trash2, MoreVertical, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleColors = {
  owner: 'bg-red-500/20 text-red-400 border-red-500/30',
  editor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at:users(created_at), email:users(email)');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar usuários',
        description: error.message,
      });
      setUsers([]);
    } else {
      // Supabase returns an array for the joined table, so we flatten it.
      const formattedUsers = data.map(u => ({
        ...u,
        email: u.email[0]?.email,
        created_at: u.created_at[0]?.created_at,
      }));
      setUsers(formattedUsers);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar função',
        description: error.message,
      });
    } else {
      toast({
        title: 'Função alterada com sucesso!',
      });
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!userId) return;
    
    // Confirmação antes de excluir
    const confirmDelete = window.confirm(`Tem certeza que deseja excluir o usuário ${userName || ''}? Esta ação não pode ser desfeita.`);
    
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      
      // Primeiro, verifica se o usuário está tentando excluir a si mesmo
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === userId) {
        throw new Error('Você não pode excluir sua própria conta aqui. Use as configurações do seu perfil.');
      }
      
      // Exclui o perfil do usuário (isso acionará uma política RLS no Supabase)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Se chegou até aqui, a exclusão foi bem-sucedida
      toast({
        title: 'Usuário excluído',
        description: `O usuário ${userName || ''} foi removido com sucesso.`,
      });
      
      // Atualiza a lista de usuários
      await fetchUsers();
      
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir usuário',
        description: error.message || 'Ocorreu um erro ao tentar excluir o usuário.',
      });
    } finally {
      setLoading(false);
    }
  }
  
  const handleInviteUser = async () => {
    const email = prompt('Digite o e-mail do usuário que deseja convidar:');
    
    if (!email) return;
    
    // Validação simples de e-mail
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        variant: 'destructive',
        title: 'E-mail inválido',
        description: 'Por favor, insira um endereço de e-mail válido.'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Primeiro, verifica se o e-mail já está em uso
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        throw new Error('Já existe um usuário com este e-mail.');
      }
      
      // Envia o convite via Supabase Auth
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
        data: { invited_by: (await supabase.auth.getUser()).data.user?.id }
      });
      
      if (inviteError) throw inviteError;
      
      // Cria um registro na tabela de perfis com papel padrão 'viewer'
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: inviteData.user.id, 
            email: email,
            role: 'viewer',
            full_name: email.split('@')[0] // Nome padrão baseado no e-mail
          }
        ]);
      
      if (profileError) throw profileError;
      
      toast({
        title: 'Convite enviado!',
        description: `Um convite foi enviado para ${email}. O usuário deve verificar o e-mail para criar uma senha.`,
      });
      
      // Atualiza a lista de usuários
      await fetchUsers();
      
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar convite',
        description: error.message || 'Ocorreu um erro ao enviar o convite. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">Adicione, edite e gerencie as permissões dos usuários.</p>
        </div>
        <Button onClick={handleInviteUser} className="mt-4 sm:mt-0">
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Usuário
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-tr from-primary to-violet-400 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">{getInitials(user.full_name)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 text-xs font-medium rounded-full border ${roleColors[user.role] || roleColors.viewer}`}>
                      {user.role}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={user.role === 'owner'}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'editor')}>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Tornar Editor</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'viewer')}>
                          <Users className="mr-2 h-4 w-4" />
                          <span>Tornar Viewer</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user.id, user.full_name)} 
                          className="text-destructive focus:text-destructive"
                          disabled={user.role === 'owner'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir Usuário</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserManagement;
