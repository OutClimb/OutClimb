import { FileText, Image, MapPin, Upload, User, Users, Waypoints } from 'lucide-react'

export const NAVIGATION_ITEMS = [
  {
    title: 'Assets',
    href: '/manage/asset',
    icon: Upload,
    entity: 'asset',
  },
  {
    title: 'Forms',
    href: '/manage/form',
    icon: FileText,
    entity: 'form',
  },
  {
    title: 'Event Locations',
    href: '/manage/location',
    icon: MapPin,
    entity: 'location',
  },
  {
    title: 'Redirects',
    href: '/manage/redirect',
    icon: Waypoints,
    entity: 'redirect',
  },
  {
    title: 'Roles',
    href: '/manage/roles',
    icon: Users,
    entity: 'role',
  },
  {
    title: 'Social Images',
    href: '/manage/social-images',
    icon: Image,
    entity: 'social',
  },
  {
    title: 'Users',
    href: '/manage/users',
    icon: User,
    entity: 'user',
  },
]
