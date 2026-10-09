import { FileText, Image, Mail, MapPin, Upload, User, Users, Waypoints } from 'lucide-react'

export const NAVIGATION_ITEMS = [
  {
    title: 'Assets',
    href: '/manage/asset',
    icon: Upload,
    entity: 'asset',
    group: 'general',
  },
  {
    title: 'Emails',
    href: '/manage/email',
    icon: Mail,
    entity: 'email',
    group: 'forms',
  },
  {
    title: 'Forms',
    href: '/manage/form',
    icon: FileText,
    entity: 'form',
    group: 'forms',
  },
  {
    title: 'Event Locations',
    href: '/manage/location',
    icon: MapPin,
    entity: 'location',
    group: 'events',
  },
  {
    title: 'Redirects',
    href: '/manage/redirect',
    icon: Waypoints,
    entity: 'redirect',
    group: 'general',
  },
  {
    title: 'Roles',
    href: '/manage/roles',
    icon: Users,
    entity: 'role',
    group: 'access',
  },
  {
    title: 'Social Images',
    href: '/manage/social-images',
    icon: Image,
    entity: 'social',
    group: 'events',
  },
  {
    title: 'Users',
    href: '/manage/users',
    icon: User,
    entity: 'user',
    group: 'access',
  },
]

export const NAVIGATION_GROUPS = [
  { id: 'general', title: 'General' },
  { id: 'forms', title: 'Forms' },
  { id: 'events', title: 'Events' },
  { id: 'access', title: 'Access' },
]
