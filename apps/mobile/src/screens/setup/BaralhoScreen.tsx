import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ESTILOS,
  ROLES_LOBOS,
  ROLES_SOLITARIOS,
  ROLES_VILA,
  role,
  varianteImplementada,
  type DeckStyle,
  type Role,
  type RoleId,
} from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Ambiente } from '../../components/Ambiente';
import { corDaFaccao } from '../../components/Motivo';
import { IconeDeRole } from '../../components/IconeDeRole';
import { Aparicao } from '../../components/animacoes';
import { Botao, Rotulo, Titulo, Pequeno } from '../../components/ui';
import { cores, espaco, raio, tipografia, alvoMinimo } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Baralho'>;

type Aba = 'montar' | 'pronto';

/**
 * Tela de baralho — depois do modo, e com tela própria.
 *
 * **Montar o seu vem primeiro, de propósito.** É a escolha que dá autoria à
 * mesa, e a que o dossiê descreve como o coração do produto: o host não escolhe
 * um baralho, ele monta uma experiência. Os presets existem para quem tem
 * pressa, não como caminho principal.
 */
export function BaralhoScreen({ navigation }: Props) {
  const s = useJogo();
  const [aba, setAba] = useState<Aba>('montar');
  const [aberta, setAberta] = useState<RoleId | null>(null);

  const total = s.deck.roleIds.length;
  const faltam = s.jogadores.length - total;
  const completo = faltam === 0;

  const grupos: { titulo: string; roles: readonly Role[] }[] = [
    { titulo: 'Vila', roles: ROLES_VILA },
    { titulo: 'Lobos', roles: ROLES_LOBOS },
    { titulo: 'Solitários', roles: ROLES_SOLITARIOS },
  ];

  return (
    <Ambiente tipo="operacao" clima="neutro" tremula={false}>
      {/* Cabeçalho fixo com a contagem: é o número que o host olha o tempo todo. */}
      <View style={{ paddingHorizontal: espaco.lg, paddingTop: espaco.md, gap: espaco.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: espaco.sm }}>
          <Titulo>O baralho</Titulo>
          <Text
            style={[
              tipografia.interface,
              { color: completo ? cores.horezu : cores.cera, marginLeft: 'auto' },
            ]}
          >
            {total} / {s.jogadores.length}
          </Text>
        </View>
        {s.equilibrio && total > 0 && (
          <Pequeno cor={s.equilibrio.aceitavel ? cores.horezu : cores.garanca}>
            {s.equilibrio.leitura.replace('-', ' ').replace(/^./, (letra) => letra.toUpperCase())}
            {s.equilibrio.aceitavel ? '' : ' (não recomendado)'}
          </Pequeno>
        )}
      </View>

      {/* Duas abas: montar (padrão) e pronto. */}
      <View
        style={{
          flexDirection: 'row',
          gap: espaco.xs,
          padding: espaco.lg,
          paddingBottom: espaco.sm,
        }}
      >
        {(
          [
            ['montar', 'Montar o meu'],
            ['pronto', 'Prontos'],
          ] as const
        ).map(([id, rotulo]) => (
          <Pressable
            key={id}
            onPress={() => setAba(id)}
            style={{
              flex: 1,
              minHeight: alvoMinimo,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: raio.padrao,
              borderWidth: 1,
              borderColor: aba === id ? cores.garanca : '#3E362E',
              backgroundColor: aba === id ? '#241A17' : 'transparent',
            }}
          >
            <Text
              style={[
                tipografia.interface,
                { color: aba === id ? cores.linhoCru : cores.ferrugem },
              ]}
            >
              {rotulo}
            </Text>
          </Pressable>
        ))}
      </View>

      {aba === 'montar' ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: espaco.lg,
            paddingBottom: espaco.xl,
            gap: espaco.sm,
          }}
        >
          <Pequeno>
            Escolha quantas cartas de cada função entram, e qual versão de cada uma. Toque no nome
            para ver as variantes.
          </Pequeno>

          {/*
            Sorteio entre as escolhidas.
            É o meio-termo entre montar carta a carta e aceitar o Baralho
            Surpresa inteiro: o host marca QUAIS funções topa ver na mesa, sem
            dizer quantas de cada, e o app sorteia uma composição válida só com
            elas — medindo o equilíbrio, como em qualquer outro baralho.
          */}
          <View
            style={{
              borderWidth: 1,
              borderColor: s.permitidas.length > 0 ? cores.cera : '#2E2721',
              borderRadius: raio.padrao,
              padding: espaco.md,
              gap: espaco.sm,
              marginBottom: espaco.xs,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
              <View style={{ flex: 1 }}>
                <Rotulo cor={s.permitidas.length > 0 ? cores.cera : cores.ferrugem}>
                  Sortear entre as escolhidas
                </Rotulo>
                <Text style={[tipografia.pequeno, { color: cores.ferrugem, fontSize: 11 }]}>
                  {s.permitidas.length === 0
                    ? 'Toque no losango de cada função que pode entrar.'
                    : `${s.permitidas.length} marcadas · o app escolhe ${s.jogadores.length} entre elas`}
                </Text>
              </View>
              {s.permitidas.length > 0 && (
                <Pressable onPress={s.limparPermitidas} hitSlop={10}>
                  <Text style={[tipografia.rotulo, { color: cores.nogueira, fontSize: 10 }]}>
                    desmarcar
                  </Text>
                </Pressable>
              )}
            </View>

            <Botao
              tom={s.permitidas.length > 0 ? 'primario' : 'secundario'}
              desabilitado={s.permitidas.length === 0}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                s.sortearEntrePermitidas();
              }}
            >
              Sortear a mesa
            </Botao>
          </View>

          {/*
            Composição oculta: a mesa não vê o que entrou.
            Fica junto do sorteio de propósito — é a mesma ideia levada ao fim:
            o host escolhe o vocabulário e nem ele vê a composição.
          */}
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              s.setConfig({ composicaoOculta: !s.config.composicaoOculta });
            }}
            style={{
              minHeight: alvoMinimo,
              flexDirection: 'row',
              alignItems: 'center',
              gap: espaco.md,
              borderWidth: 1,
              borderColor: s.config.composicaoOculta ? cores.cera : '#2E2721',
              backgroundColor: s.config.composicaoOculta ? '#241A17' : '#1A1613',
              borderRadius: raio.padrao,
              paddingHorizontal: espaco.md,
              marginBottom: espaco.xs,
            }}
          >
            <View
              style={{
                width: 16,
                height: 16,
                borderWidth: 1.5,
                borderColor: s.config.composicaoOculta ? cores.cera : '#3E362E',
                backgroundColor: s.config.composicaoOculta ? cores.cera : 'transparent',
                transform: [{ rotate: '45deg' }],
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[tipografia.interface, { color: cores.linhoCru }]}>
                Composição oculta
              </Text>
              <Text style={[tipografia.pequeno, { color: cores.ferrugem, fontSize: 11 }]}>
                {s.config.composicaoOculta
                  ? 'Ninguém vê o baralho. Cada um descobre só a própria função.'
                  : 'A mesa vê quais funções entraram antes de começar.'}
              </Text>
            </View>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: espaco.sm, marginBottom: espaco.xs }}>
            <Botao tom="claro" onPress={s.limparBaralho} style={{ flex: 1 }}>
              Limpar
            </Botao>
          </View>

          {grupos.map((g, gi) => (
            <View key={g.titulo} style={{ gap: espaco.xs, marginTop: espaco.sm }}>
              <Rotulo>{g.titulo}</Rotulo>
              {g.roles.map((r, i) => (
                <Aparicao key={r.id} atraso={gi * 40 + i * 12}>
                  <LinhaDeRole
                    r={r}
                    oculta={s.config.composicaoOculta}
                    permitida={s.permitidas.includes(r.id)}
                    onPermitir={() => {
                      void Haptics.selectionAsync();
                      s.alternarPermitida(r.id);
                    }}
                    quantidade={s.contarRole(r.id)}
                    varianteId={s.config.variantes[r.id]}
                    aberta={aberta === r.id}
                    cheio={completo}
                    onAbrir={() => setAberta(aberta === r.id ? null : r.id)}
                    onAjustar={(d) => {
                      void Haptics.selectionAsync();
                      s.ajustarRole(r.id, d);
                    }}
                    onVariante={(v) => s.escolherVariante(r.id, v)}
                  />
                </Aparicao>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: espaco.lg,
            paddingBottom: espaco.xl,
            gap: espaco.sm,
          }}
        >
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              s.baralhoSurpresa();
            }}
            style={{
              borderWidth: 1,
              borderColor: cores.cera,
              backgroundColor: '#241A17',
              borderRadius: raio.padrao,
              padding: espaco.md,
              gap: 4,
            }}
          >
            <Text style={[tipografia.interface, { color: cores.cera }]}>Baralho Surpresa</Text>
            <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>
              O app monta uma composição válida que ninguém na mesa conhece de antemão.
            </Text>
          </Pressable>

          {/*
            O que o baralho escolhido tem dentro.
            O Baralho Surpresa trocava a composição em silêncio: o host tocava,
            o contador no topo mudava de número e nenhuma carta aparecia. Sem
            isto não há como revisar — nem como decidir se vale sortear de novo.
          */}
          {s.config.composicaoOculta && (
            <View
              style={{
                borderWidth: 1,
                borderColor: cores.cera,
                borderRadius: raio.padrao,
                padding: espaco.md,
                marginTop: espaco.sm,
                gap: 4,
              }}
            >
              <Rotulo cor={cores.cera}>Composição oculta</Rotulo>
              <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>
                O baralho está fechado. Cada um vê só a própria função, na noite 1, e a mesa inteira
                só descobre o resto no fim da partida.
              </Text>
            </View>
          )}

          {s.deck.roleIds.length > 0 && !s.config.composicaoOculta && (
            <View style={{ gap: espaco.xs, marginTop: espaco.sm }}>
              <Rotulo cor={cores.cera}>Neste baralho · {s.deck.nome}</Rotulo>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
                {[
                  ...new Map(
                    s.deck.roleIds.map((id) => [id, s.deck.roleIds.filter((x) => x === id).length]),
                  ).entries(),
                ].map(([id, n]) => (
                  <View
                    key={id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: '#1D1814',
                      borderWidth: 1,
                      borderColor: '#2E2721',
                      borderRadius: raio.padrao,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                    }}
                  >
                    <IconeDeRole roleId={id} tamanho={22} cor={corDaFaccao(id)} />
                    <Text style={[tipografia.pequeno, { color: cores.linhoCru }]}>
                      {role(id).nome}
                      {n > 1 ? ` ×${n}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {ESTILOS.map((e, i) => (
            <Aparicao key={e.id} atraso={i * 20}>
              <Pressable
                onPress={() => s.setEstilo(e.id as DeckStyle)}
                style={{
                  minHeight: alvoMinimo,
                  borderWidth: 1,
                  borderColor: s.deck.id === e.id ? cores.garanca : '#2E2721',
                  backgroundColor: s.deck.id === e.id ? '#241A17' : '#1D1814',
                  borderRadius: raio.padrao,
                  padding: espaco.md,
                  gap: 2,
                }}
              >
                <Text style={[tipografia.interface, { color: cores.linhoCru }]}>{e.nome}</Text>
                <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>{e.frase}</Text>
              </Pressable>
            </Aparicao>
          ))}
        </ScrollView>
      )}

      <View style={{ padding: espaco.lg, gap: espaco.xs }}>
        {!completo && (
          <Pequeno cor={cores.garanca}>
            {faltam > 0
              ? `Faltam ${faltam} carta(s) para fechar a mesa.`
              : `Há ${-faltam} carta(s) a mais do que jogadores.`}
          </Pequeno>
        )}
        <Botao desabilitado={!completo} onPress={() => navigation.navigate('Sistemas')}>
          Continuar
        </Botao>
      </View>
    </Ambiente>
  );
}

/** Uma linha do construtor: motivo, nome, contador e as variantes. */
function LinhaDeRole({
  r,
  quantidade,
  varianteId,
  aberta,
  cheio,
  permitida,
  oculta,
  onAbrir,
  onAjustar,
  onVariante,
  onPermitir,
}: {
  r: Role;
  quantidade: number;
  varianteId: string | undefined;
  aberta: boolean;
  cheio: boolean;
  /** Marcada para entrar no sorteio. Independe da quantidade escolhida à mão. */
  permitida: boolean;
  /** Composição oculta: mostra `?` no lugar da quantidade. */
  oculta: boolean;
  onAbrir: () => void;
  onAjustar: (delta: number) => void;
  onVariante: (v: string | null) => void;
  onPermitir: () => void;
}) {
  const cor = corDaFaccao(r.id);
  const dentro = quantidade > 0;

  return (
    <View
      /*
       * A linha selecionada tem FUNDO e BORDA, não sombra.
       *
       * Antes o fundo era `dentro ? '' : '#1A1613'` — string vazia não é cor
       * válida, então a linha escolhida ficava sem fundo nenhum. Com
       * `elevation` e sem superfície opaca, o Android desenha a sombra solta e
       * deslocada para baixo (o `elevation` ignora `shadowOffset`), que é a
       * mancha esquisita em volta das funções selecionadas.
       *
       * Borda colorida faz o mesmo trabalho e é honesta: diz "esta entrou" sem
       * fingir profundidade que a tela não tem. Também cumpre "nunca cor
       * sozinha" — o contador ao lado diz quantas.
       */
      style={{
        backgroundColor: dentro ? '#241A17' : '#1A1613',
        borderWidth: 1,
        borderColor: dentro ? cor : '#2E2721',
        borderRadius: raio.padrao,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: alvoMinimo }}>
        {/*
          O marcador do sorteio.
          Losango e não caixa de seleção: é o motivo da Vila no vocabulário do
          jogo, e o alvo de toque tem 44px mesmo com o desenho pequeno — no
          escuro, alvo pequeno é alvo errado.
        */}
        <Pressable
          onPress={onPermitir}
          hitSlop={6}
          style={{
            width: 44,
            alignSelf: 'stretch',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel={`${permitida ? 'Tirar' : 'Pôr'} ${r.nome} no sorteio`}
        >
          <View
            style={{
              width: 16,
              height: 16,
              borderWidth: 1.5,
              borderColor: permitida ? cores.cera : '#3E362E',
              backgroundColor: permitida ? cores.cera : 'transparent',
              transform: [{ rotate: '45deg' }],
            }}
          />
        </Pressable>

        <Pressable
          onPress={onAbrir}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingRight: 12,
          }}
        >
          <IconeDeRole
            roleId={r.id}
            varianteId={varianteId}
            tamanho={36}
            cor={dentro ? cor : cores.nogueira}
          />
          <View style={{ flex: 1 }}>
            <Text style={[tipografia.corpo, { color: dentro ? cores.linhoCru : cores.ferrugem }]}>
              {varianteId ? r.variantes.find((v) => v.id === varianteId)?.nome : r.nome}
            </Text>
            <Text style={[tipografia.pequeno, { color: cores.ferrugem, fontSize: 11 }]}>
              {r.variantes.length > 0 ? ` Ver ${r.variantes.length} variantes` : ''}
            </Text>
          </View>
        </Pressable>

        {/*
          Contador.
          O alvo sempre teve 44 x 48, que passa no mínimo da identidade — o que
          faltava era AFORDÂNCIA. Um `−` e um `+` soltos, no escuro, com o
          aparelho passando de mão em mão, leem como texto e não como botão: a
          pessoa aperta o nome da função em vez do sinal. A moldura resolve isso
          sem mexer em tamanho nenhum.
        */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.xs }}>
          <Passo sinal="−" onPress={() => onAjustar(-1)} inativo={quantidade === 0} />
          <Text
            style={[
              tipografia.numero,
              {
                fontSize: 18,
                color: dentro ? cores.linhoCru : cores.nogueira,
                width: 24,
                textAlign: 'center',
              },
            ]}
          >
            {/*
              Com a composição oculta, o host continua montando — ele só não vê
              QUANTAS de cada entraram. É o que faz o baralho ser surpresa até
              para quem o montou.
            */}
            {oculta ? '?' : quantidade}
          </Text>
          <Passo sinal="+" onPress={() => onAjustar(1)} inativo={cheio} />
        </View>
      </View>

      {aberta && (
        <View
          style={{
            padding: espaco.md,
            gap: espaco.sm,
            borderTopWidth: 1,
            borderTopColor: '#2E2721',
          }}
        >
          <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>{r.descricaoLonga}</Text>

          {r.variantes.length > 0 && (
            <>
              <Rotulo cor={cores.cera}>Variantes</Rotulo>
              {/* A variante é um COMPLEMENTO do motivo: o ícone ao lado muda junto. */}
              <View style={{ gap: espaco.xs }}>
                <OpcaoDeVariante
                  roleId={r.id}
                  nome={`${r.nome} (base)`}
                  descricao={r.descricaoCurta}
                  peso={r.peso}
                  ativa={!varianteId}
                  onPress={() => onVariante(null)}
                />
                {r.variantes.map((v) => (
                  <OpcaoDeVariante
                    key={v.id}
                    roleId={r.id}
                    varianteId={v.id}
                    nome={v.nome}
                    descricao={v.descricao}
                    peso={v.peso}
                    ativa={varianteId === v.id}
                    onPress={() => onVariante(v.id)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function OpcaoDeVariante({
  roleId,
  varianteId,
  nome,
  descricao,
  peso,
  ativa,
  onPress,
}: {
  roleId: RoleId;
  varianteId?: string;
  nome: string;
  descricao: string;
  peso: number;
  ativa: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaco.sm,
        minHeight: alvoMinimo,
        borderWidth: 1,
        borderColor: ativa ? cores.cera : '#2E2721',
        borderRadius: raio.padrao,
        padding: espaco.sm,
      }}
    >
      <IconeDeRole
        roleId={roleId}
        varianteId={varianteId}
        tamanho={32}
        cor={ativa ? cores.cera : cores.nogueira}
      />
      <View style={{ flex: 1 }}>
        <Text style={[tipografia.pequeno, { color: ativa ? cores.linhoCru : cores.ferrugem }]}>
          {nome}
        </Text>
        <Text style={[tipografia.pequeno, { color: cores.nogueira, fontSize: 11 }]}>
          {descricao}
        </Text>
        {/* O host precisa saber antes de escolher, não depois de jogar. */}
        {varianteId && !varianteImplementada(varianteId) && (
          <Text style={[tipografia.rotulo, { color: cores.nogueira, fontSize: 9 }]}>
            regra ainda não implementada
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// `role` é reexportado por conveniência de quem lê este arquivo isolado.
void role;

/** Um lado do contador: moldura de 38px dentro do alvo de 44 x 48. */
function Passo({
  sinal,
  onPress,
  inativo,
}: {
  sinal: string;
  onPress: () => void;
  inativo: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => ({
        width: 44,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: inativo ? 0.25 : 1,
        transform: [{ translateY: pressed && !inativo ? 1 : 0 }],
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#3E362E',
          backgroundColor: '#1D1814',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: cores.linhoCru, fontSize: 20, lineHeight: 22 }}>{sinal}</Text>
      </View>
    </Pressable>
  );
}
