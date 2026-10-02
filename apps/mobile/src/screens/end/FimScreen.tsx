import { View, Text, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role, nomeDaCarta, MISSOES_POR_ID } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Botao, Titulo, Rotulo, Pequeno, ItemJogador } from '../../components/ui';
import { Ambiente } from '../../components/Ambiente';
import { corDaFaccao } from '../../components/Motivo';
import { IconeDeRole } from '../../components/IconeDeRole';
import { Aparicao, Revelacao } from '../../components/animacoes';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Fim'>;

/**
 * Telas 16 a 18 — Vencedores em camadas, resumo e jogar de novo.
 *
 * Camadas importam: a vila pode vencer e o Bobo também. Mostrar só um vencedor
 * apagaria metade do desenho do jogo.
 */
export function FimScreen({ navigation }: Props) {
  const { estado, vitoria, encerrar } = useJogo();

  if (!estado) return <Ambiente clima="vitoria" />;

  const camadas = vitoria?.camadas ?? [];
  const principal = camadas[0];
  const nomeDe = (id: string) => estado.players.find((x) => x.id === id)?.nome ?? '?';

  const titulo =
    principal?.camada === 'vila'
      ? 'A vila resistiu.'
      : principal?.camada === 'lobos'
        ? 'A matilha tomou a vila.'
        : 'A partida acabou.';

  return (
    <Ambiente clima="vitoria">
      <Revelacao>
        <View style={{ alignItems: 'center', paddingTop: espaco.xl, paddingHorizontal: espaco.lg }}>
          <Text style={{ color: cores.folhaDeOuro, fontSize: 28 }}>◆</Text>
          <Text
            style={[
              tipografia.titulo,
              { color: cores.folhaDeOuro, textAlign: 'center', marginTop: espaco.sm },
            ]}
          >
            {titulo}
          </Text>
        </View>
      </Revelacao>

      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        {camadas.map((c, i) => (
          <Aparicao key={i} atraso={i * 90} style={{ gap: 4 }}>
            <Rotulo cor={cores.folhaDeOuro}>
              {c.camada === 'solitario' ? 'Vitória paralela' : c.camada}
            </Rotulo>
            <Text style={[tipografia.corpo, { color: cores.linhoCru }]}>
              {c.vencedores.length > 0 ? c.vencedores.map(nomeDe).join(' · ') : '—'}
            </Text>
            <Pequeno>{c.motivo}</Pequeno>
          </Aparicao>
        ))}

        <View style={{ height: espaco.md }} />
        <Rotulo>Quem era quem</Rotulo>
        <View style={{ gap: espaco.xs }}>
          {estado.players.map((p, i) => {
            const r = role(p.roleId);
            const cor = corDaFaccao(p.roleId);
            const missao = MISSOES_POR_ID.get(estado.objetivosSecretos[p.id] ?? '');
            return (
              <Aparicao key={p.id} atraso={200 + i * 45}>
                <ItemJogador
                  nome={p.nome}
                  morto={p.status === 'morto'}
                  corDoPonto={cor}
                  detalhe={
                    /*
                     * O nome da CARTA, e não o da função base.
                     *
                     * A tela final é onde a mesa descobre tudo, e dizer
                     * "Xerife" a quem jogou a noite toda de Boca Calada apaga
                     * exatamente a informação que explica o que aconteceu.
                     */
                    `${nomeDaCarta(r, p.varianteId)}` +
                    (p.status === 'morto'
                      ? ` · morreu na ${p.mortoNaRodada}ª noite (${p.causaMorte})`
                      : '') +
                    (missao ? ` · missão: ${missao.texto}` : '')
                  }
                  direita={
                    <IconeDeRole
                      roleId={p.roleId}
                      varianteId={p.varianteId}
                      tamanho={30}
                      cor={cor}
                    />
                  }
                />
              </Aparicao>
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
        <Pequeno cor={cores.nogueiraTexto}>
          Guarde a semente para repetir exatamente esta partida.
        </Pequeno>
      </ScrollView>

      <View style={{ padding: espaco.lg, gap: espaco.sm }}>
        <Botao
          onPress={() => {
            encerrar();
            /*
             * A pilha inteira do setup, e não só a Revisão.
             *
             * `reset` com uma rota só deixa a tela sem nada embaixo: o botão
             * "Voltar" da Revisão chama `goBack()` e não tem para onde ir.
             * Relatado assim: "após eu clicar em jogar novamente, e vou pra
             * tela de revisão não consigo voltar".
             */
            navigation.reset({
              index: 4,
              routes: [
                { name: 'Home' },
                { name: 'Jogadores' },
                { name: 'Modo' },
                { name: 'Baralho' },
                { name: 'Revisao' },
              ],
            });
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
    </Ambiente>
  );
}
