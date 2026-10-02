import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role, nomeDaCarta } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Botao, Titulo, Rotulo, Pequeno } from '../../components/ui';
import { Ambiente } from '../../components/Ambiente';
import { corDaFaccao } from '../../components/Motivo';
import { IconeDeRole } from '../../components/IconeDeRole';
import { Revelacao } from '../../components/animacoes';
import { cores, espaco, tipografia, familia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Execucao'>;

/** Tela 15 — Execução: resultado e revelação, se configurada. */
export function ExecucaoScreen({ navigation }: Props) {
  const { estado, vitoria, seguirParaNoite } = useJogo();

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  useEffect(() => {
    if (vitoria?.encerrada) navigation.reset({ index: 0, routes: [{ name: 'Fim' }] });
  }, [vitoria, navigation]);

  if (!estado) return <Ambiente clima="morte" />;

  const votacao = estado.historicoVotos.at(-1);
  const executados = estado.players.filter(
    (p) => p.status === 'morto' && p.mortoNaRodada === estado.rodada,
  );
  const anuncios = estado.anuncios.filter(
    // Só o que o DIA disse. O que a noite narrou já foi contado no Amanhecer.
    (a) => a.rodada === estado.rodada && a.fase === 'dia',
  );

  return (
    <Ambiente clima="morte">
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: espaco.lg,
          gap: espaco.md,
        }}
      >
        <Rotulo>Dia {estado.rodada}</Rotulo>

        {!votacao?.linchadoId ? (
          <>
            <Titulo>Ninguém foi condenado.</Titulo>
            <Pequeno cor={cores.ferrugem}>
              {votacao?.empate ? 'A votação empatou.' : 'Não houve condenação nesta votação.'}
            </Pequeno>
          </>
        ) : (
          <View style={{ alignItems: 'center', gap: espaco.lg }}>
            {executados.map((p, i) => (
              <Revelacao key={p.id} atraso={i * 320}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: cores.sangueSecoTexto, fontSize: 26 }}>✝</Text>
                  <Text style={[tipografia.titulo, { color: cores.linhoCru }]}>{p.nome}</Text>
                  {estado.config.revelarRoleAoMorrer && (
                    <>
                      <IconeDeRole
                        roleId={p.roleId}
                        varianteId={p.varianteId}
                        tamanho={44}
                        cor={corDaFaccao(p.roleId)}
                      />
                      <Text style={[tipografia.nomeDeRole, { color: cores.cera, fontSize: 20 }]}>
                        {nomeDaCarta(role(p.roleId), p.varianteId)}
                      </Text>
                    </>
                  )}
                </View>
              </Revelacao>
            ))}
          </View>
        )}

        {anuncios.length > 0 && (
          <View style={{ marginTop: espaco.lg, gap: 6, alignItems: 'center' }}>
            {anuncios.map((a, i) => (
              <Text
                key={i}
                style={[
                  tipografia.corpoSerif,
                  { fontFamily: familia.serifItalico, color: cores.cera, textAlign: 'center' },
                ]}
              >
                {a.texto}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={{ padding: espaco.lg }}>
        <Botao
          onPress={() => {
            seguirParaNoite();
            navigation.reset({ index: 0, routes: [{ name: 'Passagem' }] });
          }}
        >
          A noite cai
        </Botao>
      </View>
    </Ambiente>
  );
}
