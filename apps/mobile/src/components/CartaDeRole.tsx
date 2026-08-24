import { View, Text } from 'react-native';
import { role, type RoleId } from '@jogo/engine';
import { Motivo, MotivoVivo, corDaFaccao } from './Motivo';
import { Linho } from './Ambiente';
import { cores, espaco, tipografia } from '../theme';

/**
 * A carta de role.
 *
 * Especificação da seção 9 da identidade: proporção 3:4, moldura interna a 9px,
 * motivo no topo, nome em serifada itálica. É uma tela de MOMENTO — portanto
 * tem textura (o linho), tem tremulação no motivo, e não tem nada de operação.
 *
 * A moldura dupla não é enfeite: é a citação direta da carta impressa, que é o
 * objeto que o app está substituindo.
 */
export function CartaDeRole({ roleId, varianteId, largura = 240, viva = true }: {
  roleId: RoleId;
  varianteId?: string | undefined;
  largura?: number;
  /** `false` no catálogo, onde tremulação em lista vira ruído. */
  viva?: boolean;
}) {
  const r = role(roleId);
  const variante = varianteId ? r.variantes.find((v) => v.id === varianteId) : undefined;
  const cor = corDaFaccao(roleId);
  const Icone = viva ? MotivoVivo : Motivo;

  return (
    <View
      style={{
        width: largura,
        height: largura * (4 / 3),
        backgroundColor: '#1B1613',
        borderColor: cores.nogueira,
        borderWidth: 1,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <Linho opacidade={0.05} />

      {/* Moldura interna a 9px — a medida exata do documento. */}
      <View
        style={{
          position: 'absolute',
          top: 9,
          left: 9,
          right: 9,
          bottom: 9,
          borderWidth: 1,
          borderColor: cor,
          opacity: 0.35,
        }}
      />

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: espaco.lg,
          gap: espaco.sm,
        }}
      >
        <Icone roleId={roleId} varianteId={varianteId} tamanho={largura * 0.3} cor={cor} />

        <Text
          style={[
            tipografia.nomeDeRole,
            { color: cores.linhoCru, textAlign: 'center', fontSize: largura * 0.11 },
          ]}
        >
          {variante?.nome ?? r.nome}
        </Text>

        {variante && (
          <Text style={[tipografia.rotulo, { color: cor, fontSize: 9 }]}>{r.nome}</Text>
        )}

        <Text
          style={[
            tipografia.pequeno,
            { color: cores.ferrugem, textAlign: 'center', fontSize: largura * 0.055 },
          ]}
        >
          {variante?.descricao ?? r.descricaoCurta}
        </Text>
      </View>

      {/* Rodapé: facção e peso, como no verso de uma carta de verdade. */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: espaco.lg,
          paddingBottom: espaco.md,
        }}
      >
        <Text style={[tipografia.rotulo, { color: cor, fontSize: 9 }]}>{r.faccao}</Text>
        <Text style={[tipografia.rotulo, { color: cores.nogueira, fontSize: 9 }]}>
          peso {variante?.peso ?? r.peso}
        </Text>
      </View>
    </View>
  );
}
