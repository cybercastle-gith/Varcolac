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
  type DeckStyle,
  type Role,
  type RoleId,
} from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Ambiente } from '../../components/Ambiente';
import { Motivo, corDaFaccao } from '../../components/Motivo';
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
    <Ambiente clima="neutro" tremula={false}>
      {/* Cabeçalho fixo com a contagem: é o número que o host olha o tempo todo. */}
      <View style={{ paddingHorizontal: espaco.lg, paddingTop: espaco.md, gap: espaco.xs }}>
        <Rotulo>Passo 3 de 5</Rotulo>
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
            índice {s.equilibrio.ie} · {s.equilibrio.leitura.replace('-', ' ')}
          </Pequeno>
        )}
      </View>

      {/* Duas abas: montar (padrão) e pronto. */}
      <View style={{ flexDirection: 'row', gap: espaco.xs, padding: espaco.lg, paddingBottom: espaco.sm }}>
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
              style={[tipografia.interface, { color: aba === id ? cores.linhoCru : cores.ferrugem }]}
            >
              {rotulo}
            </Text>
          </Pressable>
        ))}
      </View>

      {aba === 'montar' ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: espaco.lg, paddingBottom: espaco.xl, gap: espaco.sm }}>
          <Pequeno>
            Escolha quantas cartas de cada função entram, e qual versão de cada uma. Toque no
            nome para ver as variantes.
          </Pequeno>

          <View style={{ flexDirection: 'row', gap: espaco.sm, marginBottom: espaco.xs }}>
            <Botao tom="secundario" onPress={s.limparBaralho} style={{ flex: 1 }}>
              Limpar
            </Botao>
            <Botao
              tom="secundario"
              onPress={s.completarComAldeoes}
              desabilitado={faltam <= 0}
              style={{ flex: 1 }}
            >
              {faltam > 0 ? `+${faltam} Aldeão` : 'Completo'}
            </Botao>
          </View>

          {grupos.map((g, gi) => (
            <View key={g.titulo} style={{ gap: espaco.xs, marginTop: espaco.sm }}>
              <Rotulo>{g.titulo}</Rotulo>
              {g.roles.map((r, i) => (
                <Aparicao key={r.id} atraso={gi * 40 + i * 12}>
                  <LinhaDeRole
                    r={r}
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
        <ScrollView contentContainerStyle={{ paddingHorizontal: espaco.lg, paddingBottom: espaco.xl, gap: espaco.sm }}>
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
function LinhaDeRole({ r, quantidade, varianteId, aberta, cheio, onAbrir, onAjustar, onVariante }: {
  r: Role;
  quantidade: number;
  varianteId: string | undefined;
  aberta: boolean;
  cheio: boolean;
  onAbrir: () => void;
  onAjustar: (delta: number) => void;
  onVariante: (v: string | null) => void;
}) {
  const cor = corDaFaccao(r.id);
  const dentro = quantidade > 0;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: dentro ? cor : '#2E2721',
        backgroundColor: dentro ? '#221B17' : '#1A1613',
        borderRadius: raio.padrao,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: alvoMinimo }}>
        <Pressable
          onPress={onAbrir}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: espaco.sm, padding: espaco.sm }}
        >
          <Motivo roleId={r.id} varianteId={varianteId} tamanho={30} cor={dentro ? cor : cores.nogueira} />
          <View style={{ flex: 1 }}>
            <Text style={[tipografia.corpo, { color: dentro ? cores.linhoCru : cores.ferrugem }]}>
              {varianteId ? r.variantes.find((v) => v.id === varianteId)?.nome : r.nome}
            </Text>
            <Text style={[tipografia.pequeno, { color: cores.ferrugem, fontSize: 11 }]}>
              peso {varianteId ? r.variantes.find((v) => v.id === varianteId)?.peso : r.peso}
              {r.variantes.length > 0 ? ` · ${r.variantes.length} variantes` : ''}
            </Text>
          </View>
        </Pressable>

        {/* Contador. Alvos de 44px: o mínimo que a mão acerta no escuro. */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => onAjustar(-1)}
            disabled={quantidade === 0}
            style={{ width: 44, height: 48, alignItems: 'center', justifyContent: 'center', opacity: quantidade === 0 ? 0.25 : 1 }}
          >
            <Text style={{ color: cores.linhoCru, fontSize: 20 }}>−</Text>
          </Pressable>
          <Text
            style={[
              tipografia.numero,
              { fontSize: 17, color: dentro ? cores.linhoCru : cores.nogueira, width: 22, textAlign: 'center' },
            ]}
          >
            {quantidade}
          </Text>
          <Pressable
            onPress={() => onAjustar(1)}
            disabled={cheio}
            style={{ width: 44, height: 48, alignItems: 'center', justifyContent: 'center', opacity: cheio ? 0.25 : 1 }}
          >
            <Text style={{ color: cores.linhoCru, fontSize: 20 }}>+</Text>
          </Pressable>
        </View>
      </View>

      {aberta && (
        <View style={{ padding: espaco.md, gap: espaco.sm, borderTopWidth: 1, borderTopColor: '#2E2721' }}>
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

function OpcaoDeVariante({ roleId, varianteId, nome, descricao, peso, ativa, onPress }: {
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
      <Motivo
        roleId={roleId}
        varianteId={varianteId}
        tamanho={26}
        cor={ativa ? cores.cera : cores.nogueira}
      />
      <View style={{ flex: 1 }}>
        <Text style={[tipografia.pequeno, { color: ativa ? cores.linhoCru : cores.ferrugem }]}>
          {nome}
        </Text>
        <Text style={[tipografia.pequeno, { color: cores.nogueira, fontSize: 11 }]}>
          {descricao}
        </Text>
      </View>
      <Text style={[tipografia.pequeno, { color: cores.nogueira }]}>{peso}</Text>
    </Pressable>
  );
}

// `role` é reexportado por conveniência de quem lê este arquivo isolado.
void role;
