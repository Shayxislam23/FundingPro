/// <reference types="nativewind/types" />
/// <reference types="react-native-css-interop/types" />

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
