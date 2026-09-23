import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { contagemDeLobosVisivel, type PlayerId } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { useTelaAcesa } from '../../hooks/useTelaAcesa';
import { SegurarParaRevelar } from '../../components/SegurarParaRevelar';
import { CartaDeRole } from '../../components/CartaDeRole';
import { corDaFaccao } from '../../components/Motivo';
import { IconeDeRole } from '../../components/IconeDeRole';
import { Ambiente } from '../../components/Ambiente';
import { Aparicao, Pulso, Revelacao } from '../../components/animacoes';
import { Botao, Rotulo, Titulo, Pequeno, Corpo, ItemJogador } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Passagem'>;

type Etapa = 'entregar' | 'revelar' | 'agir';

/**
 * A passagem completa do celular.
 *
 * Três momentos por jogador: "Passe para X" → segurar para revelar (só na noite
 * 1) → agir, ou toque falso. Todos recebem o aparelho, sempre, porque sem isso
 * quem tem poder se revela pela chamada.
 *
 * A ambientação é `noite` o tempo inteiro: é a única tela do app onde o Índigo
 * domina, e é o que faz a mesa perceber que a noite caiu sem ninguém avisar.
 */
export function PassagemScreen({ navigation }: Props) {
  useTelaAcesa();

  const { estado, roteiro, indice, registrarAcao, proximaPassagem } = useJogo();
  const [etapa, setEtapa] = useState<Etapa>('entregar');
  const [alvos, setAlvos] = useState<PlayerId[]>([]);

  const passagem = roteiro[indice];

  useEffect(() => {
    setEtapa('entregar');
    setAlvos([]);
  }, [indice]);

  useEffect(() => {
    if (estado && estado.fase !== 'noite') {
      navigation.reset({ index: 0, routes: [{ name: 'Amanhecer' }] });
    }
  }, [estado, navigation]);

  if (!estado || !passagem) return <Ambiente clima="noite" />;

  const p = passagem.player;
  const cor = corDaFaccao(p.roleId);
  const nomeDe = (id: PlayerId) => estado.players.find((x) => x.id === id)?.nome ?? '?';

  const seguir = () => {
    void Haptics.selectionAsync();
    proximaPassagem();
  };

  const confirmarAcao = () => {
    const { pergunta } = passagem;
    if (!pergunta.falsa && alvos.length > 0 && pergunta.etapa) {
      registrarAcao({
        actorId: p.id,
        kind: pergunta.kind,
        etapa: pergunta.etapa,
        alvos,
        falsa: false,
      });
    }
    seguir();
  };

  // ── Entregar ───────────────────────────────────────────────────────────────
  if (etapa === 'entregar') {
    return (
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setEtapa(passagem.revelarRole ? 'revelar' : 'agir');
        }}
      >
        <Ambiente clima="noite">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md }}>
            <Revelacao>
              <View style={{ alignItems: 'center', gap: espaco.md }}>
                <Text style={{ color: cores.nogueira, fontSize: 28 }}>☽</Text>
                <Rotulo>Passe o aparelho para</Rotulo>
                <Text style={[tipografia.titulo, { color: cores.linhoCru, fontSize: 38 }]}>
                  {p.nome}
                </Text>
                <View
                  style={{
                    width: 44,
                    height: 1,
                    backgroundColor: cores.nogueira,
                    marginVertical: espaco.sm,
                  }}
                />
              </View>
            </Revelacao>
          </View>

          <View style={{ alignItems: 'center', paddingBottom: espaco.xl }}>
            <Pulso>
              <Text style={[tipografia.rotulo, { color: cores.ferrugem }]}>
                Toque quando estiver com ele
              </Text>
            </Pulso>
            <Text style={[tipografia.pequeno, { color: cores.nogueira, marginTop: espaco.sm }]}>
              {indice + 1} de {roteiro.length}
            </Text>
          </View>
        </Ambiente>
      </Pressable>
    );
  }

  // ── Revelar a função (noite 1) ─────────────────────────────────────────────
  if (etapa === 'revelar') {
    return (
      <Ambiente clima="noite">
        <View style={{ flex: 1 }}>
          <SegurarParaRevelar >
            <Revelacao>
              <View style={{ alignItems: 'center', gap: espaco.md }}>
                <CartaDeRole roleId={p.roleId} varianteId={p.varianteId} largura={230} />

                {passagem.companheiros.length > 0 && (
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={[tipografia.rotulo, { color: cor }]}>
                      {passagem.rotuloCompanheiros}
                    </Text>
                    <Text style={[tipografia.corpo, { color: cores.linhoCru }]}>
                      {passagem.companheiros.map(nomeDe).join(' · ')}
                    </Text>
                  </View>
                )}

                <Pequeno cor={cores.nogueira}>{contagemDeLobosVisivel(estado)}</Pequeno>
              </View>
            </Revelacao>
          </SegurarParaRevelar>
        </View>

        <View style={{ padding: espaco.lg }}>
          <Botao
            onPress={() => {
              void Haptics.selectionAsync();
              setEtapa('agir');
            }}
          >
            Prosseguir
          </Botao>
        </View>
      </Ambiente>
    );
  }

  // ── Agir (ou toque falso) ──────────────────────────────────────────────────
  const { pergunta } = passagem;
  const precisaDe = pergunta.tipo === 'dois-alvos' ? 2 : pergunta.tipo === 'alvo' ? 1 : 0;
  const completo = pergunta.opcional || alvos.length >= precisaDe;

  const alternar = (id: PlayerId) => {
    void Haptics.selectionAsync();
    setAlvos((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id);
      if (atual.length >= precisaDe) return [...atual.slice(1), id];
      return [...atual, id];
    });
  };

  return (
    <Ambiente clima="noite" tremula={false}>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        <Aparicao>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.md }}>
            {/* O toque falso não mostra motivo: ele não pode entregar nada. */}
            {!pergunta.falsa && (
              <IconeDeRole roleId={p.roleId} varianteId={p.varianteId} tamanho={46} cor={cor} />
            )}
            <View style={{ flex: 1 }}>
              <Rotulo>{p.nome}</Rotulo>
              <Text style={[tipografia.subtitulo, { color: cores.linhoCru }]}>
                {pergunta.titulo}
              </Text>
            </View>
          </View>
        </Aparicao>

        <Corpo cor={cores.ferrugem}>{pergunta.detalhe}</Corpo>

        {passagem.recebido.length > 0 && (
          <Aparicao atraso={60}>
            <View
              style={{
                backgroundColor: '#221B17',
                borderLeftWidth: 2,
                borderLeftColor: cores.cera,
                padding: espaco.md,
                gap: 4,
              }}
            >
              <Text style={[tipografia.rotulo, { color: cores.cera }]}>Você soube</Text>
              {passagem.recebido.map((i, k) => (
                <Text key={k} style={[tipografia.corpoSerif, { color: cores.linhoCru }]}>
                  {i.texto}
                </Text>
              ))}
            </View>
          </Aparicao>
        )}

        {pergunta.tipo === 'binaria' && (
          <View style={{ gap: espaco.sm }}>
            {pergunta.opcoes?.map((o) => (
              <Botao
                key={o.valor}
                tom={o.valor === 'sim' ? 'primario' : 'secundario'}
                onPress={() => {
                  if (o.valor === 'sim' && pergunta.etapa) {
                    registrarAcao({
                      actorId: p.id,
                      kind: pergunta.kind,
                      etapa: pergunta.etapa,
                      alvos: [],
                      falsa: false,
                    });
                  }
                  seguir();
                }}
              >
                {o.rotulo}
              </Botao>
            ))}
          </View>
        )}

        {(pergunta.tipo === 'alvo' || pergunta.tipo === 'dois-alvos') && (
          <View style={{ gap: espaco.xs }}>
            {pergunta.alvos.map((id, i) => {
              const alvo = estado.players.find((x) => x.id === id)!;
              return (
                <Aparicao key={id} atraso={i * 25}>
                  <ItemJogador
                    nome={alvo.nome}
                    morto={alvo.status === 'morto'}
                    selecionado={alvos.includes(id)}
                    corDoPonto={alvo.cor}
                    onPress={() => alternar(id)}
                    direita={
                      alvos.includes(id) ? (
                        <Text style={{ color: cores.garanca, fontSize: 15 }}>◆</Text>
                      ) : undefined
                    }
                  />
                </Aparicao>
              );
            })}
          </View>
        )}

        {pergunta.tipo === 'nenhuma' && (
          <View style={{ alignItems: 'center', paddingVertical: espaco.xl, gap: espaco.md }}>
            <Pulso>
              <Text style={{ color: cores.nogueira, fontSize: 40 }}>☽</Text>
            </Pulso>
            <Pequeno cor={cores.nogueira}>A vila dorme.</Pequeno>
          </View>
        )}
      </ScrollView>

      <View style={{ padding: espaco.lg }}>
        {pergunta.tipo !== 'binaria' && (
          <Botao desabilitado={!completo} onPress={confirmarAcao}>
            {pergunta.tipo === 'nenhuma'
              ? 'Passar adiante'
              : alvos.length > 0
                ? `Confirmar ${alvos.map(nomeDe).join(' e ')}`
                : pergunta.opcional
                  ? 'Não usar esta noite'
                  : `Escolha ${precisaDe}`}
          </Botao>
        )}
      </View>
    </Ambiente>
  );
}
