
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Warehouse, Plus, Edit, Trash2 } from 'lucide-react';
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

const BaseManagement = () => {
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentBase, setCurrentBase] = useState(null);

  const fetchBases = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bases').select('*').order('name', { ascending: true });
    if (error) {
      toast({ title: "Erro ao buscar bases", description: error.message, variant: "destructive" });
    } else {
      setBases(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBases();
  }, [fetchBases]);

  const handleOpenDialog = (base = null) => {
    setCurrentBase(base || { name: '', city: '', state_code: '' });
    setDialogOpen(true);
  };

  const handleSaveBase = async () => {
    if (!currentBase.name) {
      toast({ title: "O nome da base é obrigatório!", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('bases').upsert(currentBase, { onConflict: 'id' });
    if (error) {
      toast({ title: "Erro ao salvar base", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Base ${currentBase.id ? 'atualizada' : 'criada'} com sucesso!` });
      setDialogOpen(false);
      fetchBases();
    }
  };

  const handleDeleteBase = async (baseId) => {
    const { error } = await supabase.from('bases').delete().eq('id', baseId);
    if (error) {
      toast({ title: "Erro ao excluir base", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Base excluída com sucesso!" });
      fetchBases();
    }
  };

  return (
    <div className="space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentBase?.id ? 'Editar' : 'Nova'} Base</DialogTitle>
            <DialogDescription>Preencha os detalhes da base de carregamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nome da Base</Label><Input value={currentBase?.name} onChange={(e) => setCurrentBase({ ...currentBase, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cidade</Label><Input value={currentBase?.city} onChange={(e) => setCurrentBase({ ...currentBase, city: e.target.value })} /></div>
              <div><Label>Estado (UF)</Label><Input maxLength="2" value={currentBase?.state_code} onChange={(e) => setCurrentBase({ ...currentBase, state_code: e.target.value.toUpperCase() })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveBase}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Bases</h1>
          <p className="text-muted-foreground mt-1">Adicione e gerencie as bases de carregamento.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 sm:mt-0"><Plus className="h-4 w-4 mr-2" />Nova Base</Button>
      </motion.div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Localização</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (<tr><td colSpan="3" className="text-center p-8">Carregando...</td></tr>) :
              bases.map((base, index) => (
                <motion.tr key={base.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-accent transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">{base.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{base.city}, {base.state_code}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={() => handleOpenDialog(base)} variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button onClick={() => handleDeleteBase(base.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && bases.length === 0 && (
            <div className="text-center py-12">
              <Warehouse className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma base encontrada</h3>
              <p className="text-muted-foreground">Adicione uma nova base para começar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseManagement;
