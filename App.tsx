import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, FlatList, Image, ImageBackground, ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent, Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';

const images = {
  logo: require('./src/assets/images/cedugames-logo.png'),
  splash: require('./src/assets/images/splash-background.png'),
  learn: require('./src/assets/images/learn-through-play.png'),
  adventure: require('./src/assets/images/age-adventure.png'),
  coin: require('./src/assets/images/reward-coin.png'),
  trophy: require('./src/assets/images/reward-trophy.png'),
};
const colors = {red: '#F02229', orange: '#FA7E14', yellow: '#FECB03', blue: '#0177D2', purple: '#6336AA', pink: '#EF387E', ink: '#24123F', cream: '#FFF9EF'};
type Slide = {id: string; eyebrow: string; title: string; description: string; color: string; pale: string; kind: 'learn' | 'adventure' | 'rewards'};
const slides: Slide[] = [
  {id: 'learn', eyebrow: 'LEARN THROUGH PLAY', title: 'Big ideas become fun games', description: 'Build confidence in Maths and English with quick challenges made to feel like playtime.', color: colors.blue, pale: '#EAF7FF', kind: 'learn'},
  {id: 'adventure', eyebrow: 'MADE JUST FOR YOU', title: 'Choose your own adventure', description: 'Pick your age crew, explore colourful subjects, and move through levels at your perfect pace.', color: colors.purple, pale: '#F5ECFF', kind: 'adventure'},
  {id: 'rewards', eyebrow: 'PLAY • GROW • SHINE', title: 'Every win feels rewarding', description: 'Earn fun coins, unlock rewards, grow your streak, and celebrate your place on the leaderboard.', color: colors.orange, pale: '#FFF4DE', kind: 'rewards'},
];

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [done, setDone] = useState(false);
  return <SafeAreaProvider><StatusBar barStyle={showSplash ? 'light-content' : 'dark-content'} />{showSplash ? <AnimatedSplash onComplete={() => setShowSplash(false)} /> : done ? <Welcome /> : <Onboarding onComplete={() => setDone(true)} />}</SafeAreaProvider>;
}

function AnimatedSplash({onComplete}: {onComplete: () => void}) {
  const scale = useRef(new Animated.Value(0.72)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;
  const dots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  useEffect(() => {
    const dotAnimations = dots.map((value, index) => Animated.loop(Animated.sequence([
      Animated.delay(index * 120),
      Animated.timing(value, {toValue: -9, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true}),
      Animated.timing(value, {toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true}),
      Animated.delay(360 - index * 120),
    ])));
    dotAnimations.forEach(animation => animation.start());
    Animated.parallel([
      Animated.spring(scale, {toValue: 1, friction: 5, tension: 52, useNativeDriver: true}),
      Animated.timing(opacity, {toValue: 1, duration: 520, useNativeDriver: true}),
      Animated.timing(lift, {toValue: 0, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
    ]).start();
    const timer = setTimeout(onComplete, 2200);
    return () => {clearTimeout(timer); dotAnimations.forEach(animation => animation.stop());};
  }, [dots, lift, onComplete, opacity, scale]);
  return <ImageBackground source={images.splash} style={styles.splash} resizeMode="cover"><View style={styles.splashShade} /><Animated.Image source={images.logo} resizeMode="contain" style={[styles.splashLogo, {opacity, transform: [{translateY: lift}, {scale}]}]} /><Text style={styles.splashMessage}>Loading your adventure...</Text><View style={styles.loadingDots}>{dots.map((value, index) => <Animated.View key={index} style={[styles.loadingDot, {backgroundColor: [colors.red, colors.yellow, colors.blue][index], transform: [{translateY: value}]}]} />)}</View></ImageBackground>;
}

function Onboarding({onComplete}: {onComplete: () => void}) {
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const next = () => {if (index === slides.length - 1) return onComplete(); listRef.current?.scrollToIndex({index: index + 1, animated: true}); setIndex(index + 1);};
  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  const renderSlide = ({item}: ListRenderItemInfo<Slide>) => <View style={[styles.slide, {width, backgroundColor: item.pale}]}><View style={[styles.bubble, styles.bubbleTop, {backgroundColor: item.color}]} /><View style={[styles.bubble, styles.bubbleBottom, {backgroundColor: item.color}]} /><View style={[styles.artCard, {borderColor: `${item.color}22`}]}>{item.kind === 'rewards' ? <RewardArtwork /> : <Image source={item.kind === 'learn' ? images.learn : images.adventure} resizeMode="contain" style={item.kind === 'learn' ? styles.learnArt : styles.adventureArt} />}</View><View style={styles.slideCopy}><Text style={[styles.eyebrow, {color: item.color}]}>{item.eyebrow}</Text><Text style={styles.title}>{item.title}</Text><Text style={styles.description}>{item.description}</Text></View></View>;
  return <View style={styles.onboarding}><View style={[styles.topBar, {paddingTop: insets.top + 10}]}><Image source={images.logo} resizeMode="contain" style={styles.topLogo} /><Pressable accessibilityRole="button" onPress={onComplete} hitSlop={12} style={({pressed}) => [styles.skipButton, pressed && styles.pressed]}><Text style={styles.skipText}>Skip</Text></Pressable></View><FlatList ref={listRef} data={slides} keyExtractor={item => item.id} renderItem={renderSlide} horizontal pagingEnabled bounces={false} showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onMomentumEnd} /><View style={[styles.bottomBar, {paddingBottom: Math.max(insets.bottom, 18)}]}><View style={styles.pagination}>{slides.map((slide, dotIndex) => <View key={slide.id} style={[styles.pageDot, dotIndex === index && [styles.pageDotActive, {backgroundColor: slides[index].color}]]} />)}</View><Pressable accessibilityRole="button" onPress={next} style={({pressed}) => [styles.nextButton, {backgroundColor: slides[index].color}, pressed && styles.pressed]}><Text style={styles.nextText}>{index === slides.length - 1 ? "Let's play!" : 'Next'}</Text><Text style={styles.nextArrow}>→</Text></Pressable></View></View>;
}

function RewardArtwork() {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {const animation = Animated.loop(Animated.sequence([Animated.timing(float, {toValue: -10, duration: 950, useNativeDriver: true}), Animated.timing(float, {toValue: 0, duration: 950, useNativeDriver: true})])); animation.start(); return () => animation.stop();}, [float]);
  return <View style={styles.rewardArt}><Text style={[styles.spark, styles.sparkOne]}>★</Text><Text style={[styles.spark, styles.sparkTwo]}>✦</Text><Animated.Image source={images.trophy} resizeMode="contain" style={[styles.trophy, {transform: [{translateY: float}]}]} /><Image source={images.coin} resizeMode="contain" style={styles.coinLarge} /><Image source={images.coin} resizeMode="contain" style={styles.coinSmall} /><View style={styles.streakPill}><Text style={styles.streakText}>🔥 7 day streak!</Text></View></View>;
}

function Welcome() {
  const insets = useSafeAreaInsets();
  return <View style={[styles.welcome, {paddingTop: insets.top, paddingBottom: insets.bottom}]}><View style={styles.welcomeCircle}><Image source={images.logo} resizeMode="contain" style={styles.welcomeLogo} /></View><Text style={styles.welcomeTitle}>Ready for an adventure?</Text><Text style={styles.welcomeDescription}>Your learning journey starts here.</Text><Pressable style={({pressed}) => [styles.startButton, pressed && styles.pressed]}><Text style={styles.startText}>Get started</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  splash: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28}, splashShade: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(38,13,77,.18)'}, splashLogo: {width: '92%', maxWidth: 480, height: 190}, splashMessage: {fontFamily: 'Baloo2-SemiBold', color: '#FFF', fontSize: 17, marginTop: 28}, loadingDots: {height: 30, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18}, loadingDot: {width: 11, height: 11, borderRadius: 6},
  onboarding: {flex: 1, backgroundColor: colors.cream}, topBar: {position: 'absolute', zIndex: 5, left: 22, right: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}, topLogo: {width: 132, height: 54}, skipButton: {minWidth: 60, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center'}, skipText: {fontFamily: 'Baloo2-SemiBold', color: '#6F637D', fontSize: 16},
  slide: {flex: 1, paddingTop: 106, paddingHorizontal: 24, overflow: 'hidden'}, bubble: {position: 'absolute', borderRadius: 999, opacity: .08}, bubbleTop: {width: 210, height: 210, right: -105, top: 50}, bubbleBottom: {width: 150, height: 150, left: -75, bottom: 140}, artCard: {height: '52%', minHeight: 300, maxHeight: 480, borderRadius: 38, borderWidth: 2, backgroundColor: 'rgba(255,255,255,.72)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: colors.purple, shadowOffset: {width: 0, height: 14}, shadowOpacity: .12, shadowRadius: 24, elevation: 5}, learnArt: {width: '92%', height: '92%'}, adventureArt: {width: '100%', height: '100%'}, slideCopy: {alignItems: 'center', paddingTop: 26, paddingHorizontal: 2}, eyebrow: {fontFamily: 'Baloo2-Bold', fontSize: 13, letterSpacing: 1.7}, title: {fontFamily: 'Baloo2-ExtraBold', fontSize: 31, lineHeight: 36, color: colors.ink, textAlign: 'center', marginTop: 8}, description: {fontFamily: 'Baloo2-Medium', fontSize: 17, lineHeight: 24, color: '#6F637D', textAlign: 'center', marginTop: 10, maxWidth: 420},
  bottomBar: {backgroundColor: '#FFF', paddingHorizontal: 24, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#311150', shadowOffset: {width: 0, height: -8}, shadowOpacity: .06, shadowRadius: 18, elevation: 10}, pagination: {flexDirection: 'row', alignItems: 'center', gap: 7}, pageDot: {width: 8, height: 8, borderRadius: 5, backgroundColor: '#DDD6E5'}, pageDotActive: {width: 28}, nextButton: {height: 54, minWidth: 142, borderRadius: 18, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#352043', shadowOffset: {width: 0, height: 8}, shadowOpacity: .22, shadowRadius: 12, elevation: 5}, nextText: {fontFamily: 'Baloo2-Bold', fontSize: 17, color: '#FFF'}, nextArrow: {fontFamily: 'Baloo2-Bold', fontSize: 23, color: '#FFF', marginTop: -2}, pressed: {opacity: .84, transform: [{scale: .98}]},
  rewardArt: {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}, trophy: {width: 174, height: 224, zIndex: 2}, coinLarge: {position: 'absolute', width: 115, height: 115, right: 22, top: 36, transform: [{rotate: '12deg'}]}, coinSmall: {position: 'absolute', width: 74, height: 74, left: 25, bottom: 66, transform: [{rotate: '-15deg'}]}, spark: {position: 'absolute', fontFamily: 'Baloo2-Bold', color: colors.yellow}, sparkOne: {fontSize: 42, left: 40, top: 42}, sparkTwo: {fontSize: 34, right: 48, bottom: 80, color: colors.pink}, streakPill: {position: 'absolute', bottom: 24, backgroundColor: '#FFF', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 18, shadowColor: colors.orange, shadowOffset: {width: 0, height: 5}, shadowOpacity: .2, shadowRadius: 8, elevation: 4}, streakText: {fontFamily: 'Baloo2-Bold', color: colors.ink, fontSize: 16},
  welcome: {flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: 28}, welcomeCircle: {width: 280, height: 280, borderRadius: 140, backgroundColor: '#F0E2FF', alignItems: 'center', justifyContent: 'center'}, welcomeLogo: {width: 250, height: 130}, welcomeTitle: {fontFamily: 'Baloo2-ExtraBold', color: colors.ink, fontSize: 30, textAlign: 'center', marginTop: 32}, welcomeDescription: {fontFamily: 'Baloo2-Medium', color: '#6F637D', fontSize: 17, marginTop: 6}, startButton: {marginTop: 28, height: 56, minWidth: 210, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purple}, startText: {fontFamily: 'Baloo2-Bold', color: '#FFF', fontSize: 18},
});
export default App;
