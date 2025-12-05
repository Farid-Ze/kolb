import { ArrowRight, ArrowDown, Volume2, Shield, Cpu, Sparkles, Activity, AlertCircle, CheckCircle, Info, X } from 'lucide-react';

// Type-safe icon names
type IconName = 
  | 'arrow-right' 
  | 'arrow-down' 
  | 'sound' 
  | 'volume' 
  | 'shield' 
  | 'cpu' 
  | 'sparkles' 
  | 'activity'
  | 'alert-circle'
  | 'check-circle'
  | 'info'
  | 'x';

interface IconProps {
  name: IconName | (string & {});
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className = '' }: IconProps) {
  const icons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    'arrow-right': ArrowRight,
    'arrow-down': ArrowDown,
    'sound': Volume2,
    'volume': Volume2,
    'shield': Shield,
    'cpu': Cpu,
    'sparkles': Sparkles,
    'activity': Activity,
    'alert-circle': AlertCircle,
    'check-circle': CheckCircle,
    'info': Info,
    'x': X,
  };

  const IconComponent = icons[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={size} className={className} />;
}
