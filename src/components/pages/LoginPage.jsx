
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Fuel, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const LoginPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      let description = "Verifique seu e-mail e senha e tente novamente.";
      if (error.message.includes("Email not confirmed")) {
        description = "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
      }
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: description,
      });
    } else {
       toast({
        title: "Login bem-sucedido!",
        description: "Bem-vindo de volta!",
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, { data: { full_name: fullName } });
    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no Cadastro",
        description: error.message,
      });
    } else {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você já pode fazer o login.",
      });
      setIsLoginView(true);
    }
    setLoading(false);
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card p-8 rounded-2xl shadow-2xl border border-border">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-primary text-primary-foreground rounded-xl mb-4">
              <Fuel className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isLoginView ? 'Bem-vindo de volta!' : 'Crie sua Conta'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLoginView ? 'Acesse seu painel estratégico.' : 'Preencha os dados para se cadastrar.'}
            </p>
          </div>

          {isLoginView ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" type="text" placeholder="Seu Nome" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signup">E-mail</Label>
                <Input id="email-signup" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Senha</Label>
                <Input id="password-signup" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <Button variant="link" onClick={toggleView} className="text-sm">
              {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
