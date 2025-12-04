import { ArrowRight, Volume2 } from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className = '' }: IconProps) {
  const icons: { [key: string]: React.ComponentType<{ size?: number; className?: string }> } = {
    'arrow-right': ArrowRight,
    'volume': Volume2,
  };

  const IconComponent = icons[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={size} className={className} />;
}
