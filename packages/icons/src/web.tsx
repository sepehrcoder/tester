/**
 * Web icon set — thin wrapper over lucide-react.
 *
 * Every icon in the app should come from here (never import lucide-react
 * directly in app code) so the stroke width and default size stay
 * consistent, and so swapping the underlying icon library later only
 * touches this one file.
 *
 * Keep the semantic names in sync with `./native.tsx` — same name, same
 * underlying Lucide icon, different platform package.
 */
import {
  Home,
  Search,
  SlidersHorizontal,
  MessageCircle,
  User,
  Heart,
  Bell,
  Phone,
  Send,
  Share2,
  Plus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowLeft,
  Building2,
  Layers,
  Camera,
  ShieldCheck,
  Clock,
  Briefcase,
  Users,
  BarChart3,
  Wallet,
  Flag,
  Calculator,
  MapPin,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  Upload,
  Star,
  AlertTriangle,
  Edit3,
  Trash2,
  FileText,
  Menu,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

const DEFAULT_STROKE_WIDTH = 1.75;
const DEFAULT_SIZE = 24;

function wrap(Base: LucideIcon) {
  const Wrapped = (props: LucideProps) => (
    <Base strokeWidth={DEFAULT_STROKE_WIDTH} size={DEFAULT_SIZE} {...props} />
  );
  Wrapped.displayName = `Icon(${Base.displayName ?? "Lucide"})`;
  return Wrapped;
}

export const IconHome = wrap(Home);
export const IconSearch = wrap(Search);
export const IconFilter = wrap(SlidersHorizontal);
export const IconChat = wrap(MessageCircle);
export const IconProfile = wrap(User);
export const IconHeart = wrap(Heart);
export const IconBell = wrap(Bell);
export const IconPhone = wrap(Phone);
export const IconSend = wrap(Send);
export const IconShare = wrap(Share2);
export const IconPlus = wrap(Plus);
export const IconCheck = wrap(Check);
export const IconClose = wrap(X);
export const IconChevronRight = wrap(ChevronRight);
export const IconChevronLeft = wrap(ChevronLeft);
export const IconChevronDown = wrap(ChevronDown);
export const IconArrowLeft = wrap(ArrowLeft);
export const IconBuilding = wrap(Building2);
export const IconCompare = wrap(Layers);
export const IconCamera = wrap(Camera);
export const IconVerified = wrap(ShieldCheck);
export const IconClock = wrap(Clock);
export const IconLead = wrap(Briefcase);
export const IconClients = wrap(Users);
export const IconAnalytics = wrap(BarChart3);
export const IconBilling = wrap(Wallet);
export const IconReport = wrap(Flag);
export const IconCalculator = wrap(Calculator);
export const IconMapPin = wrap(MapPin);
export const IconSettings = wrap(Settings);
export const IconLogout = wrap(LogOut);
export const IconEye = wrap(Eye);
export const IconEyeOff = wrap(EyeOff);
export const IconUpload = wrap(Upload);
export const IconStar = wrap(Star);
export const IconAlert = wrap(AlertTriangle);
export const IconEdit = wrap(Edit3);
export const IconTrash = wrap(Trash2);
export const IconDocument = wrap(FileText);
export const IconMenu = wrap(Menu);
export const IconMic = wrap(Mic);
export const IconMicOff = wrap(MicOff);
export const IconSparkles = wrap(Sparkles);
export const IconVolume = wrap(Volume2);
export const IconVolumeOff = wrap(VolumeX);

export type { LucideProps as IconProps };
