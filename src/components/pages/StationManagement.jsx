
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Search, Edit, Trash2 } from 'lucide-react';
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

const StationManagement = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentStation, setCurrentStation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStations = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('stations').select('*').order('name', { ascending: true });
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
    }
    const { data, error } = await query;

    if (error) {
      toast({ title: "Erro ao buscar postos", description: error.message, variant: "destructive" });
    } else {
      setStations(data);
    }
    setLoading(false);
  }, [searchTerm]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const handleOpenDialog = (station = null) => {
    setCurrentStation(station || { name: '', brand: '', city: '', state_code: '', address: '', status: 'active' });
    setDialogOpen(true);
  };

  const handleSaveStation = async () => {
    if (!currentStation.name || !currentStation.city || !currentStation.state_code) {
      toast({ title: "Preencha os campos obrigatórios!", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('stations').upsert(currentStation, { onConflict: 'id' });

    if (error) {
      toast({ title: "Erro ao salvar posto", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Posto ${currentStation.id ? 'atualizado' : 'criado'} com sucesso!` });
      setDialogOpen(false);
      fetchStations();
    }
  };

  const handleDeleteStation = async (stationId) => {
    const { error } = await supabase.from('stations').delete().eq('id', stationId);
    if (error) {
      toast({ title: "Erro ao excluir posto", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Posto excluído com sucesso!" });
      fetchStations();
    }
  };

  return (
    <div className="space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentStation?.id ? 'Editar' : 'Novo'} Posto</DialogTitle>
            <DialogDescription>Preencha os detalhes do posto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Nome</Label><Input value={currentStation?.name} onChange={(e) => setCurrentStation({ ...currentStation, name: e.target.value })} /></div>
            <div><Label>Bandeira</Label><Input value={currentStation?.brand} onChange={(e) => setCurrentStation({ ...currentStation, brand: e.target.value })} /></div>
            <div><Label>Endereço</Label><Input value={currentStation?.address} onChange={(e) => setCurrentStation({ ...currentStation, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cidade</Label><Input value={currentStation?.city} onChange={(e) => setCurrentStation({ ...currentStation, city: e.target.value })} /></div>
              <div><Label>Estado (UF)</Label><Input maxLength="2" value={currentStation?.state_code} onChange={(e) => setCurrentStation({ ...currentStation, state_code: e.target.value.toUpperCase() })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <select value={currentStation?.status} onChange={(e) => setCurrentStation({ ...currentStation, status: e.target.value })} className="w-full mt-2 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveStation}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Postos</h1>
          <p className="text-muted-foreground mt-1">Controle de cadastro e coleta de preços.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 sm:mt-0"><Plus className="h-4 w-4 mr-2" />Novo Posto</Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="text" placeholder="Buscar por nome ou cidade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-accent pl-10" />
        </div>
      </motion.div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Localização</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (<tr><td colSpan="4" className="text-center p-8">Carregando...</td></tr>) :
              stations.map((station, index) => (
                <motion.tr key={station.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-accent transition-colors">
                  <td className="px-4 py-3"><p className="font-semibold text-foreground">{station.name}</p><p className="text-xs text-muted-foreground">{station.brand}</p></td>
                  <td className="px-4 py-3 text-muted-foreground">{station.city}, {station.state_code}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${station.status === 'active' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>{station.status === 'active' ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={() => handleOpenDialog(station)} variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button onClick={() => handleDeleteStation(station.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!loading && stations.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum posto encontrado</h3>
              <p className="text-muted-foreground">Tente ajustar a busca ou adicione um novo posto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationManagement;
