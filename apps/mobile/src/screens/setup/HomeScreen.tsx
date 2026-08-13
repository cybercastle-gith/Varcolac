import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import {
  DEFAULT_CONFIG,
  baralhoDeFabrica,
  calcularEquilibrio,
  criarPartida,
  formatarLog,
  resolverNoite,
  ROLES,
  sementeAleatoria,
  type NightSubmission,
} from '@jogo/engine';
import { cores } from '../../theme/colors';
import { espaco, raio, alvoMinimo } from '../../theme/spacing';

const NOMES = ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gil', 'Hilda'];

/**
 * Tela 1 — Home. Ainda é um andaime: existe para provar, no aparelho, que o
 * engine do monorepo roda dentro do app. Tela de OPERAÇÃO — fundo Fuligem liso,
 * zero textura, alvos ≥ 48px.
 *
 * TODO: substituir pelo menu real — Jogar · Baralhos salvos · Biblioteca de
 * roles · Como jogar · Ajustes.
 */
export function HomeScreen() {
  const { equilibrio, log } = useMemo(() => {
    const config = { ...DEFAULT_CONFIG, semente: sementeAleatoria() };
    const deck = baralhoDeFabrica('classico', NOMES.length);
    const jogadores = NOMES.map((nome) => ({ nome, cor: cores.linhoCru }));

    const estado = criarPartida(deck, config, jogadores);
    const lobo = estado.players.find((p) => p.roleId === 'lobo');
    const alvo = estado.players.find((p) => p.roleId !== 'lobo');

    const submissao: NightSubmission = {
      rodada: 1,
      acoes:
        lobo && alvo
          ? [
              {
                actorId: lobo.id,
                kind: 'atacar' as const,
                etapa: 'ataque' as const,
                alvos: [alvo.id],
                falsa: false,
              },
            ]
          : [],
    };

    return {
      equilibrio: calcularEquilibrio(deck, config, NOMES.length),
      log: formatarLog(resolverNoite(estado, submissao).log),
    };
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: cores.fuligem }}
      contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}
    >
      <Text style={{ color: cores.folhaDeOuro, fontSize: 11, letterSpacing: 1.5 }}>
        LABORATÓRIO NO APARELHO
      </Text>
      <Text style={{ color: cores.linhoCru, fontSize: 26 }}>Werewolf</Text>
      <Text style={{ color: cores.ferrugem }}>
        {ROLES.length} roles no catálogo · índice de equilíbrio {equilibrio.ie} (
        {equilibrio.leitura})
      </Text>

      <Pressable
        style={{
          minHeight: alvoMinimo,
          borderRadius: raio.padrao,
          backgroundColor: cores.garanca,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: cores.linhoCru, fontWeight: '600' }}>Jogar</Text>
      </Pressable>

      <View
        style={{
          backgroundColor: '#1D1814',
          borderColor: '#2E2721',
          borderWidth: 1,
          borderRadius: raio.padrao,
          padding: espaco.md,
        }}
      >
        <Text style={{ color: cores.cera, fontSize: 11, marginBottom: espaco.sm }}>
          RESOLUÇÃO DA NOITE 1
        </Text>
        <Text style={{ color: cores.linhoCru, fontSize: 12, lineHeight: 18 }}>{log}</Text>
      </View>
    </ScrollView>
  );
}
