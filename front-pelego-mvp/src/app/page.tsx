'use client';

import Field from '@/components/Field';
import SelectWithSearch from '@/components/SelectWithSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useFut } from '@/contexts/FutContext';
import { usePlayers } from '@/services/player/usePlayers';
import { Player } from '@/types/player';
import { Team } from '@/types/team';
import { calculateTeamOverall, hillClimbing } from '@/utils/createTeam';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import MultipleStopIcon from '@mui/icons-material/MultipleStop';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Select from 'react-select';

export default function Home() {
  const { userRole } = useFut();
  const router = useRouter();

  useEffect(() => {
    if (userRole === 'viewer') {
      router.replace('/weeks');
    }
  }, [userRole, router]);
  const { players } = usePlayers();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [quantityTeams, setQuantityTeams] = useState<number | null>(null);
  const [showOverall, setShowOverall] = useState(true);
  const [firstPlayerToTrade, setFirstPlayerToTrade] = useState<Player | null>(null);
  const [secondPlayerToTrade, setSecondPlayerToTrade] = useState<Player | null>(null);

  const handleGenerateTeams = () => {
    if (!quantityTeams) {
      console.log('Selecione a quantidade de times.');
      return;
    }

    const result = hillClimbing(selectedPlayers, quantityTeams, 10000);
    setTeams(result);
  };

  const handleTradePlayersBetweenTeams = () => {
    if (!firstPlayerToTrade || !secondPlayerToTrade) {
      console.log('Selecione ambos os jogadores para a troca.');
      return;
    }

    const firstPlayerCurrentTeam = teams.find((team) =>
      team.players.some((player) => player.name === firstPlayerToTrade.name),
    );

    const secondPlayerCurrentTeam = teams.find((team) =>
      team.players.some((player) => player.name === secondPlayerToTrade.name),
    );

    if (!firstPlayerCurrentTeam || !secondPlayerCurrentTeam) {
      console.log('Ambos os jogadores devem estar em times diferentes.');
      return;
    }

    const firstPlayerTeamIndex = teams.findIndex((team) => team === firstPlayerCurrentTeam);
    const secondPlayerTeamIndex = teams.findIndex((team) => team === secondPlayerCurrentTeam);

    const updatedFirstPlayerTeam = {
      ...firstPlayerCurrentTeam,
      players: firstPlayerCurrentTeam.players.filter(
        (player) => player.name !== firstPlayerToTrade.name,
      ),
    };
    const updatedSecondPlayerTeam = {
      ...secondPlayerCurrentTeam,
      players: secondPlayerCurrentTeam.players.filter(
        (player) => player.name !== secondPlayerToTrade.name,
      ),
    };

    updatedFirstPlayerTeam.players.push(secondPlayerToTrade);
    updatedSecondPlayerTeam.players.push(firstPlayerToTrade);

    const updatedTeams = [...teams];
    updatedTeams[firstPlayerTeamIndex] = updatedFirstPlayerTeam;
    updatedTeams[secondPlayerTeamIndex] = updatedSecondPlayerTeam;

    setTeams(updatedTeams);
  };

  const data = players;

  const quantityTeamsData = [
    { label: 2, value: 2 },
    { label: 3, value: 3 },
  ];

  const availablePlayers = data?.filter(
    (player) => !selectedPlayers.some((selected) => selected.name === player.name),
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">Gerador de Equipes</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Crie times balanceados automaticamente usando nosso algoritmo inteligente
        </p>
      </div>

      {/* Configuration Section */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AutoModeIcon className="h-6 w-6 text-primary" />
            Configuração dos Times
          </CardTitle>
          <CardDescription>
            Selecione os jogadores e a quantidade de times para gerar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 w-max">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Selecionar Jogadores</label>
            <SelectWithSearch
              isMulti
              placeholder="Escolha os jogadores..."
              options={availablePlayers?.map((player) => ({ label: player.name, value: player }))}
              value={selectedPlayers.map((player) => ({ label: player.name, value: player }))}
              onChange={(selectedOptions) =>
                setSelectedPlayers(
                  selectedOptions.map((option: { label: string; value: Player }) => option.value),
                )
              }
            />
            <p className="text-sm text-muted-foreground">
              {selectedPlayers.length} jogador{selectedPlayers.length !== 1 ? 'es' : ''} selecionado
              {selectedPlayers.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Quantidade de Times</label>
              <SelectWithSearch
                placeholder="Escolha a quantidade..."
                options={quantityTeamsData}
                value={quantityTeamsData.find((option) => option.value === quantityTeams) || null}
                onChange={(selectedOption) => setQuantityTeams(selectedOption?.value || null)}
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-overall"
                  onCheckedChange={() => setShowOverall(!showOverall)}
                  defaultChecked
                />
                <label
                  htmlFor="show-overall"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Mostrar Overall dos Jogadores
                </label>
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerateTeams}
            disabled={!quantityTeams || selectedPlayers.length === 0}>
            <AutoModeIcon className="mr-2 h-5 w-5" />
            Gerar Times Balanceados
          </Button>
        </CardContent>
      </Card>

      {/* Trade Players Section */}
      {teams.length !== 0 && (
        <Card className="max-w-4xl mx-auto bg-secondary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MultipleStopIcon className="h-6 w-6 text-primary" />
              Trocar Jogadores
            </CardTitle>
            <CardDescription>
              Faça ajustes manuais trocando jogadores entre os times
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Primeiro Jogador</label>
                <Select
                  value={
                    firstPlayerToTrade
                      ? { label: firstPlayerToTrade.name, value: firstPlayerToTrade }
                      : null
                  }
                  onChange={(option) => setFirstPlayerToTrade(option ? option.value : null)}
                  options={selectedPlayers.map((player) => ({ label: player.name, value: player }))}
                  placeholder="Selecione o primeiro jogador"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Segundo Jogador</label>
                <Select
                  value={
                    secondPlayerToTrade
                      ? { label: secondPlayerToTrade.name, value: secondPlayerToTrade }
                      : null
                  }
                  onChange={(option) => setSecondPlayerToTrade(option ? option.value : null)}
                  options={selectedPlayers.map((player) => ({ label: player.name, value: player }))}
                  placeholder="Selecione o segundo jogador"
                  className="text-sm"
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleTradePlayersBetweenTeams}
              disabled={!firstPlayerToTrade || !secondPlayerToTrade}>
              <MultipleStopIcon className="mr-2 h-4 w-4" />
              Realizar Troca
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Teams Display Section */}
      {teams.length !== 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Times Gerados</h2>
            <p className="text-muted-foreground">Times balanceados e prontos para jogar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gradient-primary text-primary-foreground">
                  <CardTitle className="text-xl text-black">Time {index + 1}</CardTitle>
                  <CardDescription className="text-black font-medium">
                    Overall: {calculateTeamOverall(team.players).toFixed(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <Field team={team} showOverall={showOverall} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {teams.length === 0 && (
        <Card className="max-w-2xl mx-auto text-center py-12">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <AutoModeIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Nenhum time gerado ainda</h3>
              <p className="text-muted-foreground">
                Selecione os jogadores e a quantidade de times para começar
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
