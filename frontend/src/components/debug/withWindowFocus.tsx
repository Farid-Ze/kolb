import React from 'react';
import { useWindowFocus } from '../../hooks/useWindowFocus';

export function withWindowFocus<P extends object>(
  Component: React.ComponentType<P & { isFocused: boolean; isVisible: boolean }>
) {
  return function WindowFocusWrapper(props: P) {
    const focusState = useWindowFocus();
    return <Component {...props} {...focusState} />;
  };
}
