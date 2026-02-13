'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFut } from '@/contexts/FutContext';
import { usePlayers } from '@/services/player/usePlayers';
import { useToast } from '@/hooks/use-toast';
import { MemberData } from '@/types/member';
import { InviteData } from '@/types/invite';
import { PlayerResponse } from '@/types/player';
import RoleGate from '@/components/RoleGate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getMembers,
  updateMemberRole,
  removeMember,
  linkPlayerToMember,
  updateFut,
} from '@/services/futs/resources';
import { createInvite, getInvites, revokeInvite } from '@/services/invites/resources';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddLinkIcon from '@mui/icons-material/AddLink';
import CheckIcon from '@mui/icons-material/Check';

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  user: 'secondary',
  viewer: 'outline',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  user: 'Membro',
  viewer: 'Espectador',
};

export default function FutSettingsPage() {
  return (
    <RoleGate
      allow={['admin']}
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Apenas administradores podem acessar esta pagina.</p>
        </div>
      }>
      <FutSettingsContent />
    </RoleGate>
  );
}

function FutSettingsContent() {
  const { futId, futName, refreshFuts } = useFut();
  const { players } = usePlayers();
  const { toast } = useToast();

  const [members, setMembers] = useState<MemberData[]>([]);
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Fut edit state
  const [editingFut, setEditingFut] = useState(false);
  const [futNameInput, setFutNameInput] = useState('');
  const [futDescInput, setFutDescInput] = useState('');
  const [savingFut, setSavingFut] = useState(false);

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'user' | 'viewer'>('user');
  const [inviteExpiry, setInviteExpiry] = useState<number | undefined>(7);
  const [inviteMaxUses, setInviteMaxUses] = useState<number | undefined>(undefined);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  // Link player dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkTargetMember, setLinkTargetMember] = useState<MemberData | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetMember, setDeleteTargetMember] = useState<MemberData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Copied state
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!futId) return;
    try {
      const data = await getMembers(futId);
      setMembers(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar membros',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setLoadingMembers(false);
    }
  }, [futId]);

  const loadInvites = useCallback(async () => {
    if (!futId) return;
    try {
      const data = await getInvites(futId);
      setInvites(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar convites',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setLoadingInvites(false);
    }
  }, [futId]);

  useEffect(() => {
    loadMembers();
    loadInvites();
  }, [loadMembers, loadInvites]);

  // --- Fut Info ---

  const handleEditFut = () => {
    setFutNameInput(futName || '');
    setFutDescInput('');
    setEditingFut(true);
  };

  const handleSaveFut = async () => {
    if (!futId || !futNameInput.trim()) return;
    setSavingFut(true);
    try {
      await updateFut(futId, { name: futNameInput.trim(), description: futDescInput.trim() });
      await refreshFuts();
      setEditingFut(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setSavingFut(false);
    }
  };

  // --- Members ---

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user' | 'viewer') => {
    if (!futId) return;
    try {
      await updateMemberRole(futId, userId, newRole);
      await loadMembers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar role',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    }
  };

  const handleRemoveMember = async () => {
    if (!futId || !deleteTargetMember) return;
    setDeleting(true);
    try {
      await removeMember(futId, deleteTargetMember.userId);
      setDeleteDialogOpen(false);
      setDeleteTargetMember(null);
      await loadMembers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover membro',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleLinkPlayer = async () => {
    if (!futId || !linkTargetMember || !selectedPlayerId) return;
    try {
      await linkPlayerToMember(futId, linkTargetMember.userId, selectedPlayerId);
      setLinkDialogOpen(false);
      setLinkTargetMember(null);
      setSelectedPlayerId('');
      await loadMembers();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao vincular jogador',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    }
  };

  const getPlayerName = (playerId: string): string => {
    const player = players?.find((p: PlayerResponse) => p.id === playerId);
    return player?.name || playerId;
  };

  // --- Invites ---

  const handleCreateInvite = async () => {
    if (!futId) return;
    setCreatingInvite(true);
    try {
      const invite = await createInvite(futId, {
        role: inviteRole,
        expiresInDays: inviteExpiry,
        maxUses: inviteMaxUses,
      });
      const link = `${window.location.origin}/invite/${invite.token}`;
      setGeneratedLink(link);
      await loadInvites();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar convite',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleRevokeInvite = async (token: string) => {
    if (!futId) return;
    try {
      await revokeInvite(futId, token);
      await loadInvites();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao revogar convite',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    }
  };

  const handleCopyLink = (link: string, token: string) => {
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Configuracoes do Fut</h1>

      {/* Section 1: Fut Info */}
      <section className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Informacoes</h2>
          {!editingFut && (
            <Button variant="ghost" size="sm" onClick={handleEditFut}>
              <EditIcon className="w-4 h-4 mr-1" /> Editar
            </Button>
          )}
        </div>

        {editingFut ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="futName">Nome</Label>
              <Input
                id="futName"
                value={futNameInput}
                onChange={(e) => setFutNameInput(e.target.value)}
                placeholder="Nome do Fut"
              />
            </div>
            <div>
              <Label htmlFor="futDesc">Descricao</Label>
              <Input
                id="futDesc"
                value={futDescInput}
                onChange={(e) => setFutDescInput(e.target.value)}
                placeholder="Descricao (opcional)"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveFut} disabled={savingFut}>
                {savingFut ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button variant="ghost" onClick={() => setEditingFut(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium">{futName}</p>
            <p className="text-sm text-muted-foreground">ID: {futId}</p>
          </div>
        )}
      </section>

      {/* Section 2: Members */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Membros ({members.length})</h2>

        {loadingMembers ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {member.displayName || member.email || member.userId}
                    </p>
                    <Badge variant={roleBadgeVariant[member.role]} size="sm">
                      {roleLabels[member.role]}
                    </Badge>
                  </div>
                  {member.email && (
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  )}
                  {member.linkedPlayerId && (
                    <p className="text-xs text-muted-foreground">
                      Jogador: {getPlayerName(member.linkedPlayerId)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.userId, e.target.value as 'admin' | 'user' | 'viewer')
                    }
                    className="text-xs rounded border border-border bg-background px-2 py-1">
                    <option value="admin">Admin</option>
                    <option value="user">Membro</option>
                    <option value="viewer">Espectador</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Vincular jogador"
                    onClick={() => {
                      setLinkTargetMember(member);
                      setSelectedPlayerId(member.linkedPlayerId || '');
                      setLinkDialogOpen(true);
                    }}>
                    <LinkIcon className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    title="Remover membro"
                    onClick={() => {
                      setDeleteTargetMember(member);
                      setDeleteDialogOpen(true);
                    }}>
                    <DeleteIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Invites */}
      <section className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Convites</h2>
          <Button
            size="sm"
            onClick={() => {
              setGeneratedLink('');
              setInviteDialogOpen(true);
            }}>
            <AddLinkIcon className="w-4 h-4 mr-1" /> Gerar convite
          </Button>
        </div>

        {loadingInvites ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum convite ativo.</p>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => {
              const link = `${window.location.origin}/invite/${invite.token}`;
              return (
                <div
                  key={invite.token}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{invite.token}</code>
                      <Badge variant={roleBadgeVariant[invite.role]} size="sm">
                        {roleLabels[invite.role]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>
                        Usos: {invite.usedCount}
                        {invite.maxUses !== null ? `/${invite.maxUses}` : ''}
                      </span>
                      {invite.expiresAt && (
                        <span>
                          Expira: {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Copiar link"
                      onClick={() => handleCopyLink(link, invite.token)}>
                      {copiedToken === invite.token ? (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <ContentCopyIcon className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      title="Revogar"
                      onClick={() => handleRevokeInvite(invite.token)}>
                      <DeleteIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dialog: Create Invite */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar link de convite</DialogTitle>
            <DialogDescription>
              Crie um link para convidar pessoas para o seu Fut.
            </DialogDescription>
          </DialogHeader>

          {generatedLink ? (
            <div className="space-y-4">
              <div>
                <Label>Link gerado</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={generatedLink} readOnly className="text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyLink(generatedLink, 'generated')}>
                    {copiedToken === 'generated' ? (
                      <CheckIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <ContentCopyIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setInviteDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Role do convidado</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'user' | 'viewer')}
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="user">Membro</option>
                  <option value="viewer">Espectador</option>
                </select>
              </div>
              <div>
                <Label>Expiracao</Label>
                <select
                  value={inviteExpiry ?? ''}
                  onChange={(e) =>
                    setInviteExpiry(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="1">1 dia</option>
                  <option value="7">7 dias</option>
                  <option value="30">30 dias</option>
                  <option value="">Nunca</option>
                </select>
              </div>
              <div>
                <Label>Maximo de usos</Label>
                <select
                  value={inviteMaxUses ?? ''}
                  onChange={(e) =>
                    setInviteMaxUses(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="1">1 uso</option>
                  <option value="5">5 usos</option>
                  <option value="10">10 usos</option>
                  <option value="">Ilimitado</option>
                </select>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setInviteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateInvite} disabled={creatingInvite}>
                  {creatingInvite ? 'Gerando...' : 'Gerar link'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Link Player */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular jogador</DialogTitle>
            <DialogDescription>
              Vincule um jogador a conta de{' '}
              {linkTargetMember?.displayName || linkTargetMember?.email}.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Jogador</Label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="">Selecione um jogador</option>
              {players?.map((player: PlayerResponse) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkPlayer} disabled={!selectedPlayerId}>
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirm Delete */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{' '}
              <strong>{deleteTargetMember?.displayName || deleteTargetMember?.email}</strong> do
              Fut?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={deleting}>
              {deleting ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
