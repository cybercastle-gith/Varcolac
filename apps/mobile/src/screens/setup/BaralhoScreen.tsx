import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { motivoDaPendencia, type Role, type RoleId } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { chaveDaCarta, funcoesDoModo } from '../../store/selecao';
import { Ambiente } from '../../components/Ambiente';
import { corDaFaccao } from '../../components/Motivo';
import { IconeDeRole } from '../../components/IconeDeRole';
import { Aparicao } from '../../components/animacoes';
import { Botao, Rotulo, Titulo, Pequeno } from '../../components/ui';
import { cores, espaco, raio, tipografia, alvoMinimo } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Baralho'>;

/**
 * Tela de baralho — a mesa marca SIM ou NÃO em cada carta.
 *
 * Reescrita em 2026-09-26. Antes havia três formas de montar a mesma coisa: um
 * contador `- 0 +` por função, uma lista de "permitidas" para o sorteio, e o
 * Baralho Surpresa. Três telas, três modelos mentais, e o host tinha de
 * descobrir sozinho que eram a mesma decisão vista de ângulos diferentes.
 *
 * Agora é uma lista e um interruptor. A lista diz o que a mesa ACEITA ver; o
 * interruptor (`selecaoAleatoria`) diz se o app pode escolher dentro dela. Com
 * ele ligado a mesa marca mais cartas do que cadeiras e nunca sabe quais
 * ficaram de fora — que é o único jeito honesto de esconder a composição, sem
 * uma tela de `?` implorando para ser espiada.
 *
 * **A variante é uma carta à parte.** Querer o Xerife Boca Calada sem querer o
 * Xerife normal é uma frase que o modelo antigo não conseguia dizer.
 */
export function BaralhoScreen({ navigation }: Props) {
  const s = useJogo();
  const [aberta, setAberta] = useState<RoleId | null>(null);

  const aleatoria = s.config.selecaoAleatoria;
  const saldo = s.saldoDaSelecao();
  /**
   * Quando pode seguir.
   *
   * No modo aleatório sobrar é o ponto — só faltar impede. Fora dele a conta
   * tem de fechar exata, senão a mesa veria uma lista e jogaria outra.
   */
  const pronto = aleatoria ? saldo >= 0 : saldo === 0;

  const grupos: { titulo: string; roles: readonly Role[] }[] = [
    { titulo: 'Vila', roles: funcoesDoModo(s.config.modo).filter((r) => r.faccao === 'vila') },
    { titulo: 'Lobos', roles: funcoesDoModo(s.config.modo).filter((r) => r.faccao === 'lobos') },
    {
      titulo: 'Solitários',
      roles: funcoesDoModo(s.config.modo).filter((r) => r.faccao === 'solitario'),
    },
  ].filter((g) => g.roles.length > 0);

  const alternar = (roleId: RoleId, varianteId?: string) => {
    void Haptics.selectionAsync();
    s.alternarCarta(chaveDaCarta(roleId, varianteId));
  };

  return (
    <Ambiente tipo="operacao" clima="neutro" tremula={false}>
      <View style={{ paddingHorizontal: espaco.lg, paddingTop: espaco.md, gap: espaco.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco.sm }}>
          <Titulo>O baralho</Titulo>
          <Text style={[tipografia.interface, { color: pronto ? cores.cera : cores.garanca }]}>
            {s.selecionadas.length} / {s.jogadores.length}
          </Text>
        </View>
        <Pequeno>
          {aleatoria
            ? 'Marque MAIS cartas do que cadeiras. O app escolhe quais entram, e ninguém vê.'
            : 'Marque exatamente uma carta por jogador.'}
        </Pequeno>
      </View>

      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        {/* ── O interruptor do modo de seleção ────────────────────────────── */}
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            s.setConfig({ selecaoAleatoria: !aleatoria });
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: espaco.md,
            minHeight: alvoMinimo,
            borderWidth: 1,
            borderColor: aleatoria ? cores.cera : '#2E2721',
            backgroundColor: aleatoria ? '#241A17' : '#1A1613',
            borderRadius: raio.padrao,
            padding: espaco.md,
          }}
        >
          <Marcador ligado={aleatoria} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[tipografia.interface, { color: cores.linhoCru }]}>Seleção aleatória</Text>
            <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>
              {aleatoria
                ? 'A mesa escolhe o leque; o app escolhe a mão. Ninguém sabe a composição.'
                : 'A mesa monta a composição carta por carta, e todos a conhecem.'}
            </Text>
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: espaco.sm }}>
          <View style={{ flex: 1 }}>
            <Botao tom="secundario" onPress={s.marcarTudo}>
              Marcar tudo
            </Botao>
          </View>
          <View style={{ flex: 1 }}>
            <Botao tom="secundario" onPress={s.limparSelecao}>
              Limpar
            </Botao>
          </View>
        </View>

        {grupos.map((g) => (
          <View key={g.titulo} style={{ gap: espaco.xs }}>
            <Rotulo>
              {g.titulo} · {g.roles.length}
            </Rotulo>
            {g.roles.map((r, i) => (
              <Aparicao key={r.id} atraso={i * 12}>
                <LinhaDeCarta
                  r={r}
                  selecionadas={s.selecionadas}
                  aberta={aberta === r.id}
                  onAbrir={() => setAberta(aberta === r.id ? null : r.id)}
                  onAlternar={alternar}
                />
              </Aparicao>
            ))}
          </View>
        ))}

        {s.config.modo === 'traicao' && (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: cores.cera,
              backgroundColor: '#221B17',
              padding: espaco.md,
              gap: 4,
            }}
          >
            <Rotulo cor={cores.cera}>Traição</Rotulo>
            <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>
              Não há cartas de lobo para escolher, e isso é o modo funcionando: a mesa começa
              inteira do lado da vila e a matilha nasce das conversões, uma por amanhecer.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={{ padding: espaco.lg, gap: espaco.xs }}>
        {!pronto && (
          <Pequeno cor={cores.garanca}>
            {saldo < 0
              ? `Faltam ${-saldo} carta(s) para cobrir a mesa.`
              : `Há ${saldo} carta(s) a mais. Ligue a seleção aleatória, ou desmarque.`}
          </Pequeno>
        )}
        {pronto && aleatoria && saldo > 0 && (
          <Pequeno cor={cores.cera}>
            {saldo} carta(s) vão ficar de fora, e ninguém vai saber quais.
          </Pequeno>
        )}
        <Botao desabilitado={!pronto} onPress={() => navigation.navigate('Sistemas')}>
          Continuar
        </Botao>
      </View>
    </Ambiente>
  );
}

/** O losango que diz sim ou não. O mesmo motivo da marca e das barras. */
function Marcador({ ligado }: { ligado: boolean }) {
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: ligado ? cores.cera : '#3E362E',
        backgroundColor: ligado ? cores.cera : 'transparent',
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}

/**
 * Uma função e as variantes dela, cada uma com o seu sim ou não.
 *
 * As variantes ficam recolhidas porque são 73 e a lista aberta seria ilegível —
 * mas a contagem de quantas estão marcadas aparece na linha fechada, senão o
 * host perde de vista o que escolheu três rolagens atrás.
 */
function LinhaDeCarta({
  r,
  selecionadas,
  aberta,
  onAbrir,
  onAlternar,
}: {
  r: Role;
  selecionadas: readonly string[];
  aberta: boolean;
  onAbrir: () => void;
  onAlternar: (roleId: RoleId, varianteId?: string) => void;
}) {
  const cor = corDaFaccao(r.id);
  const baseMarcada = selecionadas.includes(chaveDaCarta(r.id));
  const variantesMarcadas = r.variantes.filter((v) =>
    selecionadas.includes(chaveDaCarta(r.id, v.id)),
  ).length;
  const algumaMarcada = baseMarcada || variantesMarcadas > 0;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: algumaMarcada ? cor : '#2E2721',
        backgroundColor: algumaMarcada ? '#241A17' : '#1A1613',
        borderRadius: raio.padrao,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => onAlternar(r.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: espaco.sm,
            flex: 1,
            minHeight: alvoMinimo,
            paddingHorizontal: espaco.md,
            paddingVertical: espaco.sm,
          }}
        >
          <Marcador ligado={baseMarcada} />
          <IconeDeRole roleId={r.id} tamanho={30} cor={cor} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[tipografia.interface, { color: cores.linhoCru }]}>
              {r.nome} <Text style={{ color: cores.ferrugem }}>peso {r.peso}</Text>
            </Text>
            <Text style={[tipografia.pequeno, { color: cores.ferrugem }]} numberOfLines={2}>
              {r.descricaoCurta}
            </Text>
          </View>
        </Pressable>

        {/* Abrir as variantes é um alvo SEPARADO do de marcar a base: tocar
            para ver o que existe não pode marcar nada sem querer. */}
        <Pressable
          onPress={onAbrir}
          style={{
            minHeight: alvoMinimo,
            minWidth: 56,
            alignItems: 'center',
            justifyContent: 'center',
            borderLeftWidth: 1,
            borderLeftColor: '#2E2721',
            gap: 2,
          }}
        >
          <Text style={[tipografia.rotulo, { color: cores.nogueira, fontSize: 10 }]}>
            {variantesMarcadas > 0
              ? `${variantesMarcadas}/${r.variantes.length}`
              : r.variantes.length}
          </Text>
          <Text style={{ color: cores.nogueira, fontSize: 11 }}>{aberta ? '▴' : '▾'}</Text>
        </Pressable>
      </View>

      {aberta && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#2E2721' }}>
          {r.variantes.map((v) => {
            const marcada = selecionadas.includes(chaveDaCarta(r.id, v.id));
            const pendencia = motivoDaPendencia(v.id);
            return (
              <Pressable
                key={v.id}
                onPress={() => onAlternar(r.id, v.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: espaco.sm,
                  minHeight: alvoMinimo,
                  paddingHorizontal: espaco.md,
                  paddingVertical: espaco.sm,
                  backgroundColor: marcada ? '#2A1F1A' : 'transparent',
                }}
              >
                <Marcador ligado={marcada} />
                <IconeDeRole roleId={r.id} varianteId={v.id} tamanho={26} cor={cores.cera} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[tipografia.interface, { color: cores.linhoCru, fontSize: 14 }]}>
                    {v.nome} <Text style={{ color: cores.ferrugem }}>peso {v.peso}</Text>
                  </Text>
                  <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>{v.descricao}</Text>
                  {/* O host precisa saber ANTES de escolher, não depois de jogar. */}
                  {pendencia && <Pequeno cor={cores.nogueira}>{pendencia}</Pequeno>}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
