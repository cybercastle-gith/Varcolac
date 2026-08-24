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

  const largura = equilibrio
    ? Math.max(0, Math.min(100, ((equilibrio.ie + 10) / 20) * 100))
    : 50;

  return (
    <TelaOperacao>
      <Rolagem>
        <Rotulo>Passo 5 de 5</Rotulo>
        <Titulo>A vila desta noite</Titulo>
        <Pequeno>
          {jogadores.length} jogadores · {MODOS[config.modo].nome} · eventos{' '}
          {config.frequenciaEventos}
        </Pequeno>

        <View style={{ gap: espaco.xs, marginTop: espaco.md }}>
          {[...contagem.entries()].map(([id, n]) => {
            const r = role(id);
            const m = motivoDaFaccao(r.faccao);
            return (
              <View
                key={id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: espaco.md,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: m.cor, fontSize: 14, width: 18 }}>{m.simbolo}</Text>
                <Text style={[tipografia.corpo, { color: cores.linhoCru, flex: 1 }]}>
                  {r.nome}
                  {n > 1 ? ` ×${n}` : ''}
                </Text>
                <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>
                  {r.descricaoCurta}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: espaco.md }} />
        <Rotulo>Índice de equilíbrio</Rotulo>

        {equilibrio && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco.md }}>
              <Text style={[tipografia.numero, { color: cores.linhoCru, fontSize: 36 }]}>
                {equilibrio.ie}
              </Text>
              <Text
                style={[
                  tipografia.interface,
                  { color: equilibrio.aceitavel ? cores.horezu : cores.garanca },
                ]}
              >
                {equilibrio.leitura.replace('-', ' ')}
              </Text>
            </View>

            {/* Barra com centro marcado: Horezu no equilíbrio, Garança nos extremos. */}
            <View
              style={{
                height: 24,
                backgroundColor: '#1D1814',
                borderRadius: raio.padrao,
                borderWidth: 1,
                borderColor: '#2E2721',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  left: '50%',
                  width: 1,
                  top: 0,
                  bottom: 0,
                  backgroundColor: '#3E362E',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: `${largura}%`,
                  width: 4,
                  top: 3,
                  bottom: 3,
                  marginLeft: -2,
                  borderRadius: 2,
                  backgroundColor: equilibrio.aceitavel ? cores.horezu : cores.garanca,
                }}
              />
            </View>

            {equilibrio.violacoes.map((v) => (
              <Pequeno key={v} cor={cores.garanca}>
                {v}
              </Pequeno>
            ))}
            {equilibrio.sugestoes.map((s) => (
              <Pequeno key={s} cor={cores.cera}>
                {s}
              </Pequeno>
            ))}
            {equilibrio.violacoes.length === 0 && equilibrio.sugestoes.length === 0 && (
              <Pequeno cor={cores.horezu}>Composição dentro da tolerância.</Pequeno>
            )}
          </>
        )}

        <View style={{ height: espaco.md }} />
        <Corpo cor={cores.ferrugem} serif>
          A noite 1 já distribui as funções: o celular dá uma volta, cada pessoa vê quem é e
          já age na mesma passagem.
        </Corpo>
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
