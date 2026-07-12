import { HeaderNavigationLink } from './types';

/**
 * Header menu properties.
 */
export interface HeaderWidgetProps {
  links: HeaderNavigationLink[];
  username?: string;
  avatarUrl?: string;
}
