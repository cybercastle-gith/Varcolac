import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { complementoDe, type RoleId } from '@jogo/engine';
import { iconesDeRole } from '../theme/materiais';
import { cores } from '../theme';
import { Peca, corDaFaccao } from './Motivo';

/**
 * O ícone de função, em xilogravura (Bloco 4 de `ASSETS_A_GERAR.md`).
 *
 * Substitui o `Motivo` geométrico como desenho principal — a folha de 24
 * ícones chegou e passou no teste de aceite (legível a 15%). O `Motivo`
 * continua vivo por baixo: é dele que vem o COMPLEMENTO da variante, aplicado
 * aqui como um selo pequeno no canto, nunca substituindo o desenho base.
 *
 * O ícone NÃO é tingido pela cor da facção: é arte de três tintas fixas
 * (tinta, vermelho, creme), e forçar `tintColor` nela apagaria o desenho. A
 * distinção de facção continua vindo de outro lugar — a barra bordada da
 * carta, a borda da lista — que é a mesma razão de "nunca cor sozinha".
 */
export function IconeDeRole({ roleId, varianteId, tamanho = 40, cor, style }: {
  roleId: RoleId;
  varianteId?: string | undefined;
  tamanho?: number;
  /** Só tinge o SELO da variante, não o ícone. */
  cor?: string | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}) {
  const fonte = iconesDeRole[roleId as keyof typeof iconesDeRole];
  const complemento = complementoDe(roleId, varianteId);
  const tinta = cor ?? corDaFaccao(roleId);
  const selo = Math.max(14, Math.round(tamanho * 0.4));

  if (!fonte) return null;

  return (
    <View style={[{ width: tamanho, height: tamanho }, style]}>
      <Image source={fonte} resizeMode="contain" style={{ width: '100%', height: '100%' }} />

      {complemento.length > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -selo * 0.12,
            bottom: -selo * 0.12,
            width: selo,
            height: selo,
            borderRadius: selo / 2,
            backgroundColor: cores.fuligem,
            borderWidth: 1,
            borderColor: tinta,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {complemento.map((p, i) => (
            <Peca
              key={i}
              p={p}
              cor={tinta}
              escala={(selo / 40) * 0.62}
              traco={Math.max(1, Math.round((selo / 40) * 0.62 * 1.3))}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/** O ícone respirando à luz de vela — mesmo ritmo do `MotivoVivo`. */
export function IconeDeRoleVivo(props: Parameters<typeof IconeDeRole>[0]) {
  const brilho = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, {
          toValue: 0.965,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(brilho, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    laco.start();
    return () => laco.stop();
  }, [brilho]);

  return (
    <Animated.View style={{ opacity: brilho }}>
      <IconeDeRole {...props} />
    </Animated.View>
  );
}
