import { View, Text, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role, MISSOES_POR_ID } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaMomento, TelaOperacao, Botao, Titulo, Rotulo, Pequeno, ItemJogador } from '../../components/ui';
import { cores, espaco, tipografia, motivoDaFaccao } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Fim'>;

/**
 * Telas 16 a 18 — Vencedores em camadas, resumo e jogar de novo.
 *
 * Camadas importam: a vila pode vencer e o Bobo também. Mostrar só um vencedor
 * apagaria metade do desenho do jogo.
 */
export function FimScreen({ navigation }: Props) {
  const { estado, vitoria, encerrar } = useJogo();

  if (!estado) return <TelaMomento />;

  const camadas = vitoria?.camadas ?? [];
  const principal = camadas[0];
  const nomeDe = (id: string) => estado.players.find((x) => x.id === id)?.nome ?? '?';

  const titulo =
    principal?.camada === 'vila'
      ? 'A vila resistiu.'
      : principal?.camada === 'lobos'
        ? 'A matilha tomou a vila.'
        : principal?.camada === 'amantes'
          ? 'Só o amor sobreviveu.'
          : 'A partida acabou.';

  return (
    <TelaOperacao>
      <View style={{ alignItems: 'center', paddingTop: espaco.xl, paddingHorizontal: espaco.lg }}>
        <Text style={{ color: cores.folhaDeOuro, fontSize: 28 }}>◆</Text>
        <Text
          style={[tipografia.titulo, { color: cores.folhaDeOuro, textAlign: 'center', marginTop: espaco.sm }]}
        >
          {titulo}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        {camadas.map((c, i) => (
          <View key={i} style={{ gap: 4 }}>
            <Rotulo cor={cores.folhaDeOuro}>
              {c.camada === 'solitario' ? 'Vitória paralela' : c.camada}
            </Rotulo>
            <Text style={[tipografia.corpo, { color: cores.linhoCru }]}>
              {c.vencedores.length > 0 ? c.vencedores.map(nomeDe).join(' · ') : '—'}
            </Text>
            <Pequeno>{c.motivo}</Pequeno>
          </View>
        ))}

        <View style={{ height: espaco.md }} />
        <Rotulo>Quem era quem</Rotulo>
        <View style={{ gap: espaco.xs }}>
          {estado.players.map((p) => {
            const r = role(p.roleId);
            const m = motivoDaFaccao(r.faccao);
            const missao = MISSOES_POR_ID.get(estado.objetivosSecretos[p.id] ?? '');
            return (
              <ItemJogador
                key={p.id}
                nome={p.nome}
                morto={p.status === 'morto'}
                corDoPonto={m.cor}
                detalhe={
                  `${r.nome}` +
                  (p.status === 'morto' ? ` · morreu na ${p.mortoNaRodada}ª noite (${p.causaMorte})` : '') +
                  (missao ? ` · missão: ${missao.texto}` : '')
                }
                direita={<Text style={{ color: m.cor, fontSize: 14 }}>{m.simbolo}</Text>}
              />
            );
          })}
        </View>

        <View style={{ height: espaco.md }} />
        <Rotulo>A partida em números</Rotulo>
        <Pequeno>
          {estado.rodada} {estado.rodada === 1 ? 'noite' : 'noites'} ·{' '}
          {estado.players.filter((p) => p.status === 'morto').length} mortos ·{' '}
          {estado.eventosUsados.length} evento(s) · semente {estado.config.semente}
        </Pequeno>
        <Pequeno cor={cores.nogueira}>
          Guarde a semente para repetir exatamente esta partida.
        </Pequeno>
      </ScrollView>

      <View style={{ padding: espaco.lg, gap: espaco.sm }}>
        <Botao
          onPress={() => {
            encerrar();
            navigation.reset({ index: 0, routes: [{ name: 'Revisao' }] });
          }}
        >
          Jogar de novo
        </Botao>
        <Botao
          tom="secundario"
          onPress={() => {
            encerrar();
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        >
          Voltar ao início
        </Botao>
      </View>
    </TelaOperacao>
  );
}
