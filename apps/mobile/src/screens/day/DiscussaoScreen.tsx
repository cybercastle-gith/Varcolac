import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTelaAcesa } from '../../hooks/useTelaAcesa';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role, contagemDeLobosVisivel } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaOperacao, Botao, Rotulo, Pequeno, ItemJogador } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Discussao'>;

/**
 * Tela 13 — Discussão com cronômetro.
 *
 * Tela de OPERAÇÃO: a conversa é entre as pessoas, e a tela só marca o tempo e
 * lembra quem está vivo. O numeral passa a Garança nos últimos 30 segundos.
 */
export function DiscussaoScreen({ navigation }: Props) {
  useTelaAcesa();
  const { estado } = useJogo();
  const total = estado?.config.tempoDiscussaoSegundos ?? 180;
  const [restante, setRestante] = useState(total);
  const [rodando, setRodando] = useState(true);
  const avisou = useRef(false);

  useEffect(() => {
    if (!rodando) return;
    const id = setInterval(() => {
      setRestante((s) => {
        if (s <= 1) {
          clearInterval(id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        if (s === 31 && !avisou.current) {
          avisou.current = true;
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [rodando]);

  if (!estado) return <TelaOperacao />;

  const vivos = estado.players.filter((p) => p.status === 'vivo');
  const mortos = estado.players.filter((p) => p.status === 'morto');
  const minutos = Math.floor(restante / 60);
  const segundos = restante % 60;
  const acabando = restante <= 30;

  return (
    <TelaOperacao>
      <View style={{ alignItems: 'center', paddingTop: espaco.xl, paddingBottom: espaco.md }}>
        <Rotulo>Dia {estado.rodada}</Rotulo>
        <Text
          style={[
            tipografia.numero,
            { color: acabando ? cores.garanca : cores.linhoCru, marginVertical: espaco.sm },
          ]}
        >
          {minutos}:{String(segundos).padStart(2, '0')}
        </Text>
        <Pequeno>{contagemDeLobosVisivel(estado)}</Pequeno>
      </View>

      <View style={{ flex: 1, paddingHorizontal: espaco.lg, gap: espaco.xs }}>
        <Rotulo>Vivos · {vivos.length}</Rotulo>
        {vivos.map((p) => (
          <ItemJogador
            key={p.id}
            nome={p.nome}
            detalhe={p.silenciado ? 'preso: não fala hoje' : undefined}
            corDoPonto={p.cor}
          />
        ))}

        {mortos.length > 0 && (
          <>
            <View style={{ height: espaco.md }} />
            <Rotulo>Mortos · {mortos.length}</Rotulo>
            {mortos.map((p) => (
              <ItemJogador
                key={p.id}
                nome={p.nome}
                morto
                detalhe={
                  estado.config.revelarRoleAoMorrer ? `era ${role(p.roleId).nome}` : undefined
                }
              />
            ))}
          </>
        )}
      </View>

      <View style={{ padding: espaco.lg, gap: espaco.sm }}>
        <Botao tom="secundario" onPress={() => setRodando((r) => !r)}>
          {rodando ? 'Pausar' : 'Retomar'}
        </Botao>
        <Botao onPress={() => navigation.navigate('Votacao')}>Ir para a votação</Botao>
      </View>
    </TelaOperacao>
  );
}
