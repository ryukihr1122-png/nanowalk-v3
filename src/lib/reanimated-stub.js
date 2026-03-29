/**
 * react-native-reanimated の Expo Go 用スタブ
 * アニメーションは無効化し、クラッシュを防ぐ
 */
const { Animated, Easing: RNEasing, View, Text, Image, ScrollView } = require("react-native");

// entering/exiting アニメーションのスタブ（何もしない）
const animationStub = {
  duration: function () { return this; },
  delay: function () { return this; },
  easing: function () { return this; },
  springify: function () { return this; },
  damping: function () { return this; },
  stiffness: function () { return this; },
};

const FadeIn       = animationStub;
const FadeInDown   = animationStub;
const FadeInUp     = animationStub;
const FadeInRight  = animationStub;
const FadeOut      = animationStub;
const SlideInRight = animationStub;
const ZoomIn       = animationStub;

// useSharedValue → 通常の ref 的な値
function useSharedValue(initial) {
  const ref = { value: initial };
  return ref;
}

// useAnimatedStyle → 空のスタイルを返す
function useAnimatedStyle(_fn) {
  return {};
}

// withTiming / withSpring / withRepeat / withSequence / withDelay
function withTiming(value, _config, _cb) { return value; }
function withSpring(value, _config, _cb) { return value; }
function withRepeat(value) { return value; }
function withSequence(..._values) { return 0; }
function withDelay(_delay, value) { return value; }
function runOnJS(fn) { return fn; }

const Easing = RNEasing;

// Animated.View など entering prop を受け付けても無視する
const AnimatedView = Animated.View;
const AnimatedText = Animated.Text;
const AnimatedImage = Animated.Image;
const AnimatedScrollView = Animated.ScrollView;

const ReanimatedAnimated = {
  View: AnimatedView,
  Text: AnimatedText,
  Image: AnimatedImage,
  ScrollView: AnimatedScrollView,
  createAnimatedComponent: Animated.createAnimatedComponent,
};

module.exports = {
  default: ReanimatedAnimated,
  __esModule: true,
  // named exports
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  FadeOut,
  SlideInRight,
  ZoomIn,
  Animated: ReanimatedAnimated,
};
