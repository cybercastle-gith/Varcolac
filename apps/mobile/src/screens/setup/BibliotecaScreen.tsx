import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ROLES_VILA, ROLES_LOBOS, ROLES_SOLITARIOS, MODIFICADORES, type Role } from '@jogo/engine';
import { Rotulo, Titulo, Pequeno } from '../../components/ui';
import { Ambiente } from '../../components/Ambiente';
import { Motivo, corDaFaccao } from '../../components/Motivo';
import { Aparicao } from '../../components/animacoes';
import { cores, espaco, raio, tipografia } from '../../theme';

/**
 * Biblioteca de funções. Tela de OPERAÇÃO: é consulta, não teatro.
 *
 * Serve à diretriz de acessibilidade em 10 minutos — o app ensina no momento em
 * que a informação é necessária, e aqui é onde quem chegou agora vai procurar.
 */
function Carta({ r }: { r: Role }) {
  const [aberta, setAberta] = useState(false);
  const cor = corDaFaccao(r.id);

  return (
    <Pressable
      onPress={() => setAberta((a) => !a)}
      style={{
        backgroundColor: '#1D1814',
        borderColor: aberta ? cor : '#2E2721',
        borderWidth: 1,
        borderRadius: raio.padrao,
        padding: espaco.md,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
        <Motivo roleId={r.id} tamanho={28} cor={cor} />
        <Text style={[tipografia.nomeDeRole, { color: cores.linhoCru, fontSize: 19, flex: 1 }]}>
          {r.nome}
        </Text>
        <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>peso {r.peso}</Text>
      </View>

      <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>{r.descricaoCurta}</Text>

      {aberta && (
        <View style={{ gap: espaco.sm, marginTop: espaco.xs }}>
          <Text style={[tipografia.corpoSerif, { color: cores.linhoCru }]}>
            {r.descricaoLonga}
          </Text>
          {r.etapa && (
            <Pequeno cor={cores.nogueira}>Age na etapa: {r.etapa.replace('-', ' ')}</Pequeno>
          )}
          {r.usoLimitado.kind === 'por-partida' && (
            <Pequeno cor={cores.cera}>
              {r.usoLimitado.total === 1 ? 'Uma vez por partida.' : `${r.usoLimitado.total} usos.`}
            </Pequeno>
          )}
          {r.variantes.length > 0 && (
            <>
              <Rotulo cor={cores.cera}>Variantes</Rotulo>
              {/* O ícone da variante é o da role base MAIS o complemento. */}
              {r.variantes.map((v) => (
                <View
                  key={v.id}
                  style={{ flexDirection: 'row', gap: espaco.sm, alignItems: 'center' }}
                >
                  <Motivo roleId={r.id} varianteId={v.id} tamanho={26} cor={cores.cera} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[tipografia.interface, { color: cores.linhoCru, fontSize: 14 }]}>
                      {v.nome} <Text style={{ color: cores.ferrugem }}>· peso {v.peso}</Text>
                    </Text>
                    <Pequeno>{v.descricao}</Pequeno>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

export function BibliotecaScreen() {
  const grupos = [
    { titulo: 'Vila', roles: ROLES_VILA },
    { titulo: 'Lobos', roles: ROLES_LOBOS },
    { titulo: 'Solitários', roles: ROLES_SOLITARIOS },
  ];

  return (
    <Ambiente tipo="operacao" clima="neutro" tremula={false}>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        <Titulo>Biblioteca</Titulo>
        <Pequeno>Toque numa função para abrir a regra inteira.</Pequeno>

        {grupos.map((g) => (
          <View key={g.titulo} style={{ gap: espaco.sm, marginTop: espaco.sm }}>
            <Rotulo>
              {g.titulo} · {g.roles.length}
            </Rotulo>
            {g.roles.map((r, i) => (
              <Aparicao key={r.id} atraso={i * 18}>
                <Carta r={r} />
              </Aparicao>
            ))}
          </View>
        ))}

        <View style={{ gap: espaco.sm, marginTop: espaco.sm }}>
          <Rotulo>Modificadores · {MODIFICADORES.length}</Rotulo>
          {MODIFICADORES.map((mod) => (
            <View
              key={mod.id}
              style={{
                backgroundColor: '#1D1814',
                borderColor: '#2E2721',
                borderWidth: 1,
                borderRadius: raio.padrao,
                padding: espaco.md,
                gap: 4,
              }}
            >
              <Text style={[tipografia.nomeDeRole, { color: cores.linhoCru, fontSize: 19 }]}>
                {mod.nome}
              </Text>
              <Pequeno>{mod.descricao}</Pequeno>
              <Pequeno cor={cores.nogueira}>
                Aplica-se sobre {mod.alvos} funções existentes; cada um mantém a sua.
              </Pequeno>
            </View>
          ))}
        </View>
      </ScrollView>
    </Ambiente>
  );
}
