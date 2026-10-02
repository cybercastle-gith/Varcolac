import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role, nomeDaCarta } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Ambiente } from '../../components/Ambiente';
import { corDaFaccao } from '../../components/Motivo';
import { IconeDeRole } from '../../components/IconeDeRole';
import { Revelacao } from '../../components/animacoes';
import { Botao, Rotulo, Titulo, Pequeno } from '../../components/ui';
import { cores, espaco, tipografia, familia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Amanhecer'>;

/**
 * Amanhecer — narração, mortes e evento da noite.
 *
 * É onde o app deixa de ser ferramenta e vira mestre: a frase dita em voz alta
 * é o produto. A ambientação vira `morte` quando houve morte, e `dia` quando
 * não houve — a mesa sente a diferença antes de ler a tela.
 */
export function AmanhecerScreen({ navigation }: Props) {
  const { estado, vitoria } = useJogo();

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  useEffect(() => {
    if (vitoria?.encerrada) navigation.reset({ index: 0, routes: [{ name: 'Fim' }] });
  }, [vitoria, navigation]);

  if (!estado) return <Ambiente clima="dia" />;

  const mortosDaNoite = estado.players.filter(
    (p) => p.status === 'morto' && p.mortoNaRodada === estado.rodada,
  );
  /**
   * O anúncio do evento sai daqui: ele tem tela própria agora (`EventoScreen`),
   * mostrada antes desta. Sem este filtro a mesma frase apareceria duas vezes
   * seguidas, e a segunda vez rouba o peso da primeira.
   */
  const anuncios = estado.anuncios.filter(
    // `fase === 'noite'`: o Amanhecer conta a NOITE. Sem este filtro a tela de
    // Execução repetia tudo isto horas depois, porque as duas metades da
    // rodada compartilham o número dela.
    (a) => a.rodada === estado.rodada && a.fase === 'noite' && a.origem !== 'evento',
  );
  const houveMorte = mortosDaNoite.length > 0;

  return (
    <Ambiente clima={houveMorte ? 'morte' : 'dia'}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: espaco.lg,
          gap: espaco.md,
        }}
      >
        <Revelacao>
          <View style={{ alignItems: 'center', gap: espaco.sm }}>
            <Text style={{ color: houveMorte ? cores.sangueSecoTexto : cores.cera, fontSize: 26 }}>
              {houveMorte ? '✝' : '☉'}
            </Text>
            <Rotulo>
              {/*
                Na Vila Amaldiçoada o cabeçalho vira contador: "Noite 3 de 5".
                A mesa precisa da conta no lugar onde ela já olha todo dia, e
                não escondida no meio dos anúncios.
              */}
              Noite {estado.rodada}
              {estado.prazoDaMaldicao !== null ? ` de ${estado.prazoDaMaldicao}` : ''} · amanheceu
            </Rotulo>
          </View>
        </Revelacao>

        {!houveMorte ? (
          <Revelacao atraso={220}>
            <View style={{ alignItems: 'center', gap: espaco.sm }}>
              <Titulo>Ninguém morreu.</Titulo>
              <Pequeno cor={cores.ferrugem}>Ninguém foi atacado, ou todos os ataques falharam.</Pequeno>
            </View>
          </Revelacao>
        ) : (
          <View style={{ alignItems: 'center', gap: espaco.lg, marginTop: espaco.sm }}>
            {mortosDaNoite.map((p, i) => (
              <Revelacao key={p.id} atraso={220 + i * 320}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  {estado.config.revelarRoleAoMorrer && (
                    <IconeDeRole
                      roleId={p.roleId}
                      varianteId={p.varianteId}
                      tamanho={48}
                      cor={corDaFaccao(p.roleId)}
                    />
                  )}
                  <Text style={[tipografia.titulo, { color: cores.linhoCru }]}>{p.nome}</Text>
                  {estado.config.revelarRoleAoMorrer && (
                    <Text style={[tipografia.nomeDeRole, { color: cores.ferrugem, fontSize: 18 }]}>
                      era {nomeDaCarta(role(p.roleId), p.varianteId)}
                    </Text>
                  )}
                </View>
              </Revelacao>
            ))}
          </View>
        )}

        {anuncios.length > 0 && (
          <Revelacao atraso={600}>
            <View style={{ marginTop: espaco.lg, gap: espaco.sm, alignItems: 'center' }}>
              {/*
                Dois pesos, e a diferença é a do sussurro para o pregão.

                A pilha de frases em itálico está certa para o clima da noite —
                "a vila velou o corpo a noite toda". Está errada para "Ana é o
                Médico": essa frase muda a partida inteira e saía do mesmo
                tamanho que as outras, no pé da tela, onde a mesa passava os
                olhos. O `destaque` vem do engine (ver `Announcement`), e só as
                revelações o carregam.
              */}
              {anuncios
                .filter((a) => a.destaque)
                .map((a, i) => (
                  <View
                    key={`d${i}`}
                    style={{
                      alignSelf: 'stretch',
                      borderWidth: 1,
                      borderColor: cores.folhaDeOuro,
                      backgroundColor: '#241A17',
                      padding: espaco.md,
                      gap: 6,
                    }}
                  >
                    <Text style={[tipografia.rotulo, { color: cores.folhaDeOuro }]}>
                      {a.rotulo ?? 'Revelação'}
                    </Text>
                    <Text
                      style={[
                        tipografia.corpoSerif,
                        { color: cores.linhoCru, fontSize: 19, lineHeight: 27 },
                      ]}
                    >
                      {a.texto}
                    </Text>
                  </View>
                ))}

              {anuncios
                .filter((a) => !a.destaque)
                .map((a, i) => (
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
          </Revelacao>
        )}
      </View>

      <View style={{ padding: espaco.lg }}>
        <Botao onPress={() => navigation.navigate('Discussao')}>Abrir a discussão</Botao>
      </View>
    </Ambiente>
  );
}
