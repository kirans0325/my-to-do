declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const StyleSheet: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const TextInput: any;
  export const Modal: any;
  export const ActivityIndicator: any;
  export const StatusBar: any;
  export const SafeAreaView: any;
  export const Platform: {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos';
    select: (obj: any) => any;
  };
}

declare module 'react-native-web';
