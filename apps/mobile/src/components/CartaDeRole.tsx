import { View, Text } from 'react-native';
import { role, type RoleId } from '@jogo/engine';
import { corDaFaccao } from './Motivo';
import { IconeDeRole, IconeDeRoleVivo } from './IconeDeRole';
import { Material } from './Ambiente';
import { Bordado, faixa } from './Bordado';
import { cores, espaco, tipografia } from '../theme';

/**
 * A tinta da carta.
 *
 * A carta INVERTE a regra de cor do resto do app, e de propósito. Em toda outra
 * tela o texto é claro sobre Fuligem, porque o app é usado no escuro. Aqui o
 * objeto citado é uma carta de papel, e carta de papel tem tinta escura sobre
 * papel claro — é o que a torna reconhecível como coisa, e não como painel.
 *
 * O papel é envelhecido (`#4A3A2C` sob a textura) justamente para não virar
 * clarão na mesa: a identidade reduz o brilho nas fases noturnas, e uma carta
 * branca acesa no escuro fere o olho e ilumina o rosto de quem está agindo.
 */
const TINTA = '#160F0A';
const TINTA_FRACA = '#3B2A1D';

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
  const Icone = viva ? IconeDeRoleVivo : IconeDeRole;

  return (
    <View
      /*
       * A carta precisa ler como OBJETO, e não como um retângulo pintado no
       * fundo. Três coisas fazem isso, e nenhuma é enfeite:
       *
       * - o corpo é mais claro que a tela, não igual: papel velho sobre madeira
       *   escura, que é a cena real que está sendo citada;
       * - a sombra projetada levanta a carta do fundo — é o único lugar do app
       *   com sombra, porque é o único lugar com um objeto solto;
       * - a textura de papel sobe para 0.2. Aqui pode: é tela de MOMENTO, e a
       *   identidade só proíbe textura em tela de operação.
       */
      style={{
        width: largura,
        height: largura * (4 / 3),
        backgroundColor: '#4A3A2C',
        borderColor: cores.nogueira,
        borderWidth: 1,
        borderRadius: 4,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.55,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 7 },
        elevation: 10,
      }}
    >
      <Material material="papel" opacidade={0.55} raio={4} />

      {/*
        Costura da margem — o toque do Livro de Caça dentro de uma carta que,
        no resto, é Xilogravura Popular: a carta também é página de um
        registro encadernado, não só um objeto solto. Pequena de propósito —
        é acento, a barra bordada continua sendo quem fala primeiro.
      */}
      <View
        style={{
          position: 'absolute',
          left: 4,
          top: 26,
          bottom: 26,
          justifyContent: 'space-between',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: cores.sangueSeco, opacity: 0.4 }}
          />
        ))}
      </View>

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

      {/*
        A barra bordada, na cor da facção.
        Não é enfeite: é o que identifica a facção antes de qualquer texto, e
        cumpre a regra de "nunca cor sozinha" — a barra tem desenho, e não só
        tom, então ela continua distinguível para quem não separa verde de
        vermelho.
      */}
      <View style={{ alignItems: 'center', marginTop: espaco.lg, opacity: 0.85 }}>
        <Bordado
          trama={faixa(Math.floor(largura / 7))}
          ponto={Math.max(2, Math.round(largura * 0.014))}
          folga={2}
          tinta={{ r: cor }}
        />
      </View>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: espaco.lg,
          gap: espaco.sm,
        }}
      >
        <Icone roleId={roleId} varianteId={varianteId} tamanho={largura * 0.34} cor={cor} />

        <Text
          style={[
            tipografia.nomeDeRole,
            { color: TINTA, textAlign: 'center', fontSize: largura * 0.11 },
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
            { color: TINTA_FRACA, textAlign: 'center', fontSize: largura * 0.055 },
          ]}
        >
          {variante?.descricao ?? r.descricaoCurta}
        </Text>
      </View>

      {/*
        Rodapé: facção e peso, como no verso de uma carta de verdade.
        O fio por cima é o que separa — não o tom. Sem ele, o rodapé dependia de
        o papel escurecer ali, e onde o papel não escurecia o texto sumia.
      */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: espaco.lg,
          paddingTop: espaco.sm,
          paddingBottom: espaco.md,
          marginHorizontal: espaco.md,
          borderTopWidth: 1,
          borderTopColor: 'rgba(22,15,10,0.28)',
        }}
      >
        <Text style={[tipografia.rotulo, { color: cor, fontSize: 9 }]}>{r.faccao}</Text>
        <Text style={[tipografia.rotulo, { color: TINTA_FRACA, fontSize: 9 }]}>
          peso {variante?.peso ?? r.peso}
        </Text>
      </View>
    </View>
  );
}
