import { Dimensions } from 'react-native';

export function getDeviceLayout() {
  const { width, height } = Dimensions.get('window');
  const shortest = Math.min(width, height);
  const isTablet = shortest >= 768;
  const columns = isTablet ? 8 : 4;
  return { width, height, isTablet, columns };
}
