import { useEffect } from 'react';
import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role, MODOS } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaOperacao, Rolagem, Botao, Rotulo, Titulo, Pequeno, Corpo } from '../../components/ui';
import { cores, espaco, raio, tipografia, motivoDaFaccao } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Revisao'>;

/**
 * Tela 7 — Revisão com o índice de equilíbrio.
 *
 * O índice é visível para TODA a mesa antes de começar, e o app avisa e sugere
 * a correção — mas quem decide é o host. Nunca bloqueia.
 */
export function RevisaoScreen({ navigation }: Props) {
  const { deck, jogadores, config, equilibrio, recalcular, comecar } = useJogo();

  useEffect(() => {
    recalcular();
  }, [recalcular]);

  const contagem = new Map<string, number>();
  for (const id of deck.roleIds) contagem.set(id, (contagem.get(id) ?? 0) + 1);

  /**
   * A posição do índice na barra, de 0 a 100.
   *
   * O IE anda de -10 (vila esmagada) a +10 (vila folgada); o centro é o
   * equilíbrio. Isto já era calculado aqui e **não era desenhado em lugar
   * nenhum** — a variável ficava morta e a tela que o dossiê descreve como
   * "revisão com o índice de equilíbrio" não mostrava índice nenhum.
   */
  const largura = equilibrio ? Math.max(0, Math.min(100, ((equilibrio.ie + 10) / 20) * 100)) : 50;

  const corDoIndice = !equilibrio
    ? cores.nogueira
    : equilibrio.aceitavel
      ? cores.horezu
      : cores.garanca;

  return (
    <TelaOperacao>
      <Rolagem>
        <Titulo>Revisão do jogo</Titulo>
        <Pequeno>
          {jogadores.length} jogadores · {MODOS[config.modo].nome} · Eventos{' '}
          {config.frequenciaEventos}
        </Pequeno>

        {/* O índice, visível para a mesa inteira antes de começar. */}
        {equilibrio && (
          <View style={{ gap: espaco.sm, marginTop: espaco.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco.sm }}>
              <Text style={[tipografia.titulo, { color: corDoIndice, fontSize: 30 }]}>
                {equilibrio.ie > 0 ? `+${equilibrio.ie}` : equilibrio.ie}
              </Text>
              <Text style={[tipografia.rotulo, { color: corDoIndice, flex: 1 }]}>
                {equilibrio.leitura}
              </Text>
            </View>

            <View
              style={{
                height: 8,
                backgroundColor: '#1D1814',
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#2E2721',
                overflow: 'hidden',
              }}
            >
              {/* O centro marcado: é ele que diz o que é "equilibrado". */}
              <View
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: cores.nogueira,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: `${largura}%`,
                  top: -2,
                  width: 3,
                  height: 12,
                  backgroundColor: corDoIndice,
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[tipografia.pequeno, { color: cores.nogueira, fontSize: 10 }]}>
                matilha forte
              </Text>
              <Text style={[tipografia.pequeno, { color: cores.nogueira, fontSize: 10 }]}>
                vila forte
              </Text>
            </View>

            {/*
              O app avisa e sugere; quem decide é o host. Nunca bloqueia — e por
              isso o botão de começar continua ativo mesmo com violação.
            */}
            {equilibrio.violacoes.map((v, i) => (
              <Text key={`v${i}`} style={[tipografia.pequeno, { color: cores.garanca }]}>
                {v}
              </Text>
            ))}
            {equilibrio.sugestoes.map((v, i) => (
              <Text key={`s${i}`} style={[tipografia.pequeno, { color: cores.cera }]}>
                {v}
              </Text>
            ))}
          </View>
        )}

        {/*
          Composição oculta: a revisão mostra o índice e NÃO mostra as cartas.
          O índice fica porque ele é sobre equilíbrio, não sobre quem é quem —
          e é o único jeito de o host decidir se a mesa está jogável sem abrir
          o baralho que ele acabou de fechar.
        */}
        {config.composicaoOculta ? (
          <View style={{ gap: espaco.xs, marginTop: espaco.md }}>
            <Rotulo cor={cores.cera}>O baralho está fechado</Rotulo>
            <Pequeno>
              {deck.roleIds.length} cartas embaralhadas. Cada um vê só a própria função, na noite 1.
              A mesa inteira descobre o resto no fim.
            </Pequeno>
          </View>
        ) : (
          <View style={{ gap: espaco.xs, marginTop: espaco.md }}>
            <Rotulo>O baralho · {deck.roleIds.length} cartas</Rotulo>
            {[...contagem.entries()].map(([id, n]) => {
              const r = role(id);
              const m = motivoDaFaccao(r.faccao);
              return (
                <View
                  key={id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: espaco.md,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: m.cor, fontSize: 14, width: 18, marginTop: 2 }}>
                    {m.simbolo}
                  </Text>
                  {/*
                  Nome e descrição empilhados, não lado a lado.
                  Lado a lado, a descrição era espremida numa coluna de poucos
                  caracteres e quebrava em cinco linhas — a tela parecia quebrada
                  porque, em largura de celular, estava mesmo.
                */}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[tipografia.corpo, { color: cores.linhoCru }]}>
                      {r.nome}
                      {n > 1 ? ` ×${n}` : ''}
                    </Text>
                    <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>
                      {r.descricaoCurta}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Rolagem>

      <View style={{ padding: espaco.lg, gap: espaco.sm }}>
        <Botao
          onPress={() => {
            comecar();
            navigation.reset({ index: 0, routes: [{ name: 'Passagem' }] });
          }}
        >
          Começar a noite 1
        </Botao>
        <Botao tom="secundario" onPress={() => navigation.goBack()}>
          Voltar
        </Botao>
      </View>
    </TelaOperacao>
  );
}
