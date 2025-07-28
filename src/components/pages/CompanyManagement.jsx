
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true });
    if (error) {
      toast({ title: "Erro ao buscar companhias", description: error.message, variant: "destructive" });
    } else {
      setCompanies(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleOpenDialog = (company = null) => {
    setCurrentCompany(company || { name: '' });
    setDialogOpen(true);
  };

  const handleSaveCompany = async () => {
    if (!currentCompany.name) {
      toast({ title: "O nome da companhia é obrigatório!", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('companies').upsert(currentCompany, { onConflict: 'id' });
    if (error) {
      toast({ title: "Erro ao salvar companhia", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Companhia ${currentCompany.id ? 'atualizada' : 'criada'} com sucesso!` });
      setDialogOpen(false);
      fetchCompanies();
    }
  };

  const handleDeleteCompany = async (companyId) => {
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    if (error) {
      toast({ title: "Erro ao excluir companhia", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Companhia excluída com sucesso!" });
      fetchCompanies();
    }
  };

  return (
    <div className="space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentCompany?.id ? 'Editar' : 'Nova'} Companhia</DialogTitle>
            <DialogDescription>Preencha o nome da companhia distribuidora.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nome da Companhia</Label><Input value={currentCompany?.name} onChange={(e) => setCurrentCompany({ ...currentCompany, name: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCompany}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Companhias</h1>
          <p className="text-muted-foreground mt-1">Adicione e gerencie as companhias distribuidoras.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 sm:mt-0"><Plus className="h-4 w-4 mr-2" />Nova Companhia</Button>
      </motion.div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (<tr><td colSpan="2" className="text-center p-8">Carregando...</td></tr>) :
              companies.map((company, index) => (
                <motion.tr key={company.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-accent transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">{company.name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={() => handleOpenDialog(company)} variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button onClick={() => handleDeleteCompany(company.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && companies.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma companhia encontrada</h3>
              <p className="text-muted-foreground">Adicione uma nova companhia para começar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;
