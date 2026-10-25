import React, { useState } from "react";
import {
  Music,
  Globe,
  Terminal,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Mic,
  MicOff,
  Sun,
  Moon,
  Monitor,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Camera,
  Video,
  Image,
  FileText,
  Folder,
  Trash2,
  Copy,
  Clipboard,
  Scissors,
  Search,
  Settings,
  Power,
  RefreshCw,
  Download,
  Upload,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Clock,
  Map,
  MapPin,
  Phone,
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Speaker,
  Radio,
  Disc,
  Film,
  Clapperboard,
  Gamepad2,
  Joystick,
  Trophy,
  Target,
  Zap,
  Flame,
  Star,
  Heart,
  ThumbsUp,
  Smile,
  User,
  Users,
  Home,
  Building,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Fullscreen,
  Move,
  Mouse,
  Keyboard,
  Printer,
  QrCode,
  BarChart,
  PieChart,
  TrendingUp,
  Activity,
  Cpu,
  HardDrive,
  Server,
  Database,
  Cloud,
  CloudOff,
  CloudRain,
  Wind,
  Thermometer,
  Droplet,
  Umbrella,
  Snowflake,
  Leaf,
  TreePine,
  Mountain,
  Waves,
  Anchor,
  Plane,
  Car,
  Bike,
  Train,
  Bus,
  Rocket,
  Satellite,
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Twitch,
  Slack,
  Figma,
  Framer,
  Code,
  TerminalSquare,
  Braces,
  Box,
  Package,
  ShoppingCart,
  CreditCard,
  Wallet,
  DollarSign,
  Euro,
  PoundSterling,
  Bitcoin,
  Gift,
  Tag,
  Percent,
  Ticket,
  Award,
  Badge,
  Crown,
  Gem,
  Sparkles,
  Wand2,
  Palette,
  Paintbrush,
  PenTool,
  Pencil,
  Eraser,
  Type,
  Highlighter,
  Ruler,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Diamond,
  Pentagon,
} from "lucide-react";

export interface BuiltInIcon {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
}

const ICONS: BuiltInIcon[] = [
  { id: "music", name: "Music", category: "Media", icon: <Music size={32} /> },
  {
    id: "globe",
    name: "Website",
    category: "Media",
    icon: <Globe size={32} />,
  },
  { id: "play", name: "Play", category: "Media", icon: <Play size={32} /> },
  { id: "pause", name: "Pause", category: "Media", icon: <Pause size={32} /> },
  {
    id: "skip-back",
    name: "Previous",
    category: "Media",
    icon: <SkipBack size={32} />,
  },
  {
    id: "skip-forward",
    name: "Next",
    category: "Media",
    icon: <SkipForward size={32} />,
  },
  {
    id: "volume",
    name: "Volume",
    category: "Media",
    icon: <Volume2 size={32} />,
  },
  {
    id: "volume-off",
    name: "Mute",
    category: "Media",
    icon: <VolumeX size={32} />,
  },
  { id: "mic", name: "Microphone", category: "Media", icon: <Mic size={32} /> },
  {
    id: "mic-off",
    name: "Mic Off",
    category: "Media",
    icon: <MicOff size={32} />,
  },
  {
    id: "headphones",
    name: "Headphones",
    category: "Media",
    icon: <Headphones size={32} />,
  },
  {
    id: "speaker",
    name: "Speaker",
    category: "Media",
    icon: <Speaker size={32} />,
  },
  { id: "radio", name: "Radio", category: "Media", icon: <Radio size={32} /> },
  { id: "disc", name: "Disc", category: "Media", icon: <Disc size={32} /> },
  { id: "film", name: "Film", category: "Media", icon: <Film size={32} /> },
  {
    id: "clapperboard",
    name: "Video",
    category: "Media",
    icon: <Clapperboard size={32} />,
  },
  {
    id: "camera",
    name: "Camera",
    category: "Media",
    icon: <Camera size={32} />,
  },
  {
    id: "video",
    name: "Video Cam",
    category: "Media",
    icon: <Video size={32} />,
  },
  { id: "image", name: "Image", category: "Media", icon: <Image size={32} /> },

  {
    id: "terminal",
    name: "Terminal",
    category: "Dev",
    icon: <Terminal size={32} />,
  },
  { id: "code", name: "Code", category: "Dev", icon: <Code size={32} /> },
  {
    id: "terminal-square",
    name: "Console",
    category: "Dev",
    icon: <TerminalSquare size={32} />,
  },
  { id: "braces", name: "Braces", category: "Dev", icon: <Braces size={32} /> },
  { id: "github", name: "GitHub", category: "Dev", icon: <Github size={32} /> },
  { id: "figma", name: "Figma", category: "Dev", icon: <Figma size={32} /> },
  { id: "framer", name: "Framer", category: "Dev", icon: <Framer size={32} /> },
  {
    id: "database",
    name: "Database",
    category: "Dev",
    icon: <Database size={32} />,
  },
  { id: "server", name: "Server", category: "Dev", icon: <Server size={32} /> },
  { id: "cloud", name: "Cloud", category: "Dev", icon: <Cloud size={32} /> },
  { id: "cpu", name: "CPU", category: "Dev", icon: <Cpu size={32} /> },
  {
    id: "hard-drive",
    name: "Storage",
    category: "Dev",
    icon: <HardDrive size={32} />,
  },

  {
    id: "gamepad",
    name: "Gamepad",
    category: "Gaming",
    icon: <Gamepad2 size={32} />,
  },
  {
    id: "joystick",
    name: "Joystick",
    category: "Gaming",
    icon: <Joystick size={32} />,
  },
  {
    id: "trophy",
    name: "Trophy",
    category: "Gaming",
    icon: <Trophy size={32} />,
  },
  {
    id: "target",
    name: "Target",
    category: "Gaming",
    icon: <Target size={32} />,
  },

  {
    id: "sun",
    name: "Light Mode",
    category: "System",
    icon: <Sun size={32} />,
  },
  {
    id: "moon",
    name: "Dark Mode",
    category: "System",
    icon: <Moon size={32} />,
  },
  {
    id: "monitor",
    name: "Display",
    category: "System",
    icon: <Monitor size={32} />,
  },
  {
    id: "laptop",
    name: "Laptop",
    category: "System",
    icon: <Laptop size={32} />,
  },
  {
    id: "smartphone",
    name: "Phone",
    category: "System",
    icon: <Smartphone size={32} />,
  },
  { id: "tv", name: "TV", category: "System", icon: <Tv size={32} /> },
  { id: "wifi", name: "WiFi", category: "System", icon: <Wifi size={32} /> },
  {
    id: "wifi-off",
    name: "WiFi Off",
    category: "System",
    icon: <WifiOff size={32} />,
  },
  {
    id: "battery",
    name: "Battery",
    category: "System",
    icon: <Battery size={32} />,
  },
  {
    id: "battery-low",
    name: "Low Battery",
    category: "System",
    icon: <BatteryLow size={32} />,
  },
  { id: "power", name: "Power", category: "System", icon: <Power size={32} /> },
  {
    id: "refresh",
    name: "Refresh",
    category: "System",
    icon: <RefreshCw size={32} />,
  },
  {
    id: "settings",
    name: "Settings",
    category: "System",
    icon: <Settings size={32} />,
  },
  {
    id: "maximize",
    name: "Maximize",
    category: "System",
    icon: <Maximize size={32} />,
  },
  {
    id: "minimize",
    name: "Minimize",
    category: "System",
    icon: <Minimize size={32} />,
  },
  {
    id: "fullscreen",
    name: "Fullscreen",
    category: "System",
    icon: <Fullscreen size={32} />,
  },
  { id: "mouse", name: "Mouse", category: "System", icon: <Mouse size={32} /> },
  {
    id: "keyboard",
    name: "Keyboard",
    category: "System",
    icon: <Keyboard size={32} />,
  },

  {
    id: "folder",
    name: "Folder",
    category: "Files",
    icon: <Folder size={32} />,
  },
  {
    id: "file-text",
    name: "Document",
    category: "Files",
    icon: <FileText size={32} />,
  },
  {
    id: "download",
    name: "Download",
    category: "Files",
    icon: <Download size={32} />,
  },
  {
    id: "upload",
    name: "Upload",
    category: "Files",
    icon: <Upload size={32} />,
  },
  {
    id: "trash",
    name: "Delete",
    category: "Files",
    icon: <Trash2 size={32} />,
  },
  { id: "copy", name: "Copy", category: "Files", icon: <Copy size={32} /> },
  {
    id: "clipboard",
    name: "Paste",
    category: "Files",
    icon: <Clipboard size={32} />,
  },
  {
    id: "scissors",
    name: "Cut",
    category: "Files",
    icon: <Scissors size={32} />,
  },
  {
    id: "search",
    name: "Search",
    category: "Files",
    icon: <Search size={32} />,
  },
  {
    id: "printer",
    name: "Print",
    category: "Files",
    icon: <Printer size={32} />,
  },
  {
    id: "qr-code",
    name: "QR Code",
    category: "Files",
    icon: <QrCode size={32} />,
  },
  { id: "box", name: "Box", category: "Files", icon: <Box size={32} /> },
  {
    id: "package",
    name: "Package",
    category: "Files",
    icon: <Package size={32} />,
  },

  { id: "mail", name: "Email", category: "Social", icon: <Mail size={32} /> },
  {
    id: "message",
    name: "Message",
    category: "Social",
    icon: <MessageSquare size={32} />,
  },
  {
    id: "bell",
    name: "Notification",
    category: "Social",
    icon: <Bell size={32} />,
  },
  {
    id: "twitter",
    name: "Twitter",
    category: "Social",
    icon: <Twitter size={32} />,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "Social",
    icon: <Linkedin size={32} />,
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Social",
    icon: <Youtube size={32} />,
  },
  {
    id: "twitch",
    name: "Twitch",
    category: "Social",
    icon: <Twitch size={32} />,
  },
  { id: "slack", name: "Slack", category: "Social", icon: <Slack size={32} /> },
  { id: "user", name: "User", category: "Social", icon: <User size={32} /> },
  { id: "users", name: "Users", category: "Social", icon: <Users size={32} /> },

  { id: "home", name: "Home", category: "Places", icon: <Home size={32} /> },
  {
    id: "building",
    name: "Office",
    category: "Places",
    icon: <Building size={32} />,
  },
  { id: "map", name: "Map", category: "Places", icon: <Map size={32} /> },
  {
    id: "map-pin",
    name: "Location",
    category: "Places",
    icon: <MapPin size={32} />,
  },
  {
    id: "calendar",
    name: "Calendar",
    category: "Places",
    icon: <Calendar size={32} />,
  },
  { id: "clock", name: "Clock", category: "Places", icon: <Clock size={32} /> },

  { id: "zap", name: "Flash", category: "Actions", icon: <Zap size={32} /> },
  { id: "flame", name: "Fire", category: "Actions", icon: <Flame size={32} /> },
  { id: "star", name: "Star", category: "Actions", icon: <Star size={32} /> },
  {
    id: "heart",
    name: "Heart",
    category: "Actions",
    icon: <Heart size={32} />,
  },
  {
    id: "thumbs-up",
    name: "Like",
    category: "Actions",
    icon: <ThumbsUp size={32} />,
  },
  {
    id: "smile",
    name: "Smile",
    category: "Actions",
    icon: <Smile size={32} />,
  },
  { id: "key", name: "Key", category: "Actions", icon: <Key size={32} /> },
  { id: "lock", name: "Lock", category: "Actions", icon: <Lock size={32} /> },
  {
    id: "unlock",
    name: "Unlock",
    category: "Actions",
    icon: <Unlock size={32} />,
  },
  { id: "eye", name: "Show", category: "Actions", icon: <Eye size={32} /> },
  {
    id: "eye-off",
    name: "Hide",
    category: "Actions",
    icon: <EyeOff size={32} />,
  },
  { id: "move", name: "Move", category: "Actions", icon: <Move size={32} /> },
  {
    id: "activity",
    name: "Activity",
    category: "Actions",
    icon: <Activity size={32} />,
  },
  {
    id: "sparkles",
    name: "Sparkles",
    category: "Actions",
    icon: <Sparkles size={32} />,
  },
  { id: "wand", name: "Magic", category: "Actions", icon: <Wand2 size={32} /> },

  {
    id: "dollar",
    name: "Dollar",
    category: "Money",
    icon: <DollarSign size={32} />,
  },
  { id: "euro", name: "Euro", category: "Money", icon: <Euro size={32} /> },
  {
    id: "pound",
    name: "Pound",
    category: "Money",
    icon: <PoundSterling size={32} />,
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    category: "Money",
    icon: <Bitcoin size={32} />,
  },
  {
    id: "wallet",
    name: "Wallet",
    category: "Money",
    icon: <Wallet size={32} />,
  },
  {
    id: "credit-card",
    name: "Card",
    category: "Money",
    icon: <CreditCard size={32} />,
  },
  {
    id: "shopping-cart",
    name: "Cart",
    category: "Money",
    icon: <ShoppingCart size={32} />,
  },
  { id: "gift", name: "Gift", category: "Money", icon: <Gift size={32} /> },
  { id: "tag", name: "Tag", category: "Money", icon: <Tag size={32} /> },
  {
    id: "percent",
    name: "Percent",
    category: "Money",
    icon: <Percent size={32} />,
  },
  {
    id: "ticket",
    name: "Ticket",
    category: "Money",
    icon: <Ticket size={32} />,
  },

  { id: "award", name: "Award", category: "Misc", icon: <Award size={32} /> },
  { id: "badge", name: "Badge", category: "Misc", icon: <Badge size={32} /> },
  { id: "crown", name: "Crown", category: "Misc", icon: <Crown size={32} /> },
  { id: "gem", name: "Gem", category: "Misc", icon: <Gem size={32} /> },
  {
    id: "palette",
    name: "Palette",
    category: "Misc",
    icon: <Palette size={32} />,
  },
  {
    id: "paintbrush",
    name: "Brush",
    category: "Misc",
    icon: <Paintbrush size={32} />,
  },
  {
    id: "pen-tool",
    name: "Pen",
    category: "Misc",
    icon: <PenTool size={32} />,
  },
  {
    id: "pencil",
    name: "Pencil",
    category: "Misc",
    icon: <Pencil size={32} />,
  },
  { id: "type", name: "Type", category: "Misc", icon: <Type size={32} /> },
  {
    id: "thermometer",
    name: "Temperature",
    category: "Misc",
    icon: <Thermometer size={32} />,
  },
  {
    id: "droplet",
    name: "Water",
    category: "Misc",
    icon: <Droplet size={32} />,
  },
  { id: "wind", name: "Wind", category: "Misc", icon: <Wind size={32} /> },
  {
    id: "cloud-rain",
    name: "Rain",
    category: "Misc",
    icon: <CloudRain size={32} />,
  },
  {
    id: "snowflake",
    name: "Snow",
    category: "Misc",
    icon: <Snowflake size={32} />,
  },
  { id: "sun", name: "Sun", category: "Misc", icon: <Sun size={32} /> },
  { id: "leaf", name: "Leaf", category: "Misc", icon: <Leaf size={32} /> },
  { id: "tree", name: "Tree", category: "Misc", icon: <TreePine size={32} /> },
  {
    id: "mountain",
    name: "Mountain",
    category: "Misc",
    icon: <Mountain size={32} />,
  },
  { id: "waves", name: "Waves", category: "Misc", icon: <Waves size={32} /> },
  {
    id: "anchor",
    name: "Anchor",
    category: "Misc",
    icon: <Anchor size={32} />,
  },
  {
    id: "rocket",
    name: "Rocket",
    category: "Misc",
    icon: <Rocket size={32} />,
  },
  { id: "plane", name: "Plane", category: "Misc", icon: <Plane size={32} /> },
  { id: "car", name: "Car", category: "Misc", icon: <Car size={32} /> },
  { id: "bike", name: "Bike", category: "Misc", icon: <Bike size={32} /> },
  { id: "train", name: "Train", category: "Misc", icon: <Train size={32} /> },
  { id: "bus", name: "Bus", category: "Misc", icon: <Bus size={32} /> },
  {
    id: "satellite",
    name: "Satellite",
    category: "Misc",
    icon: <Satellite size={32} />,
  },
  { id: "phone", name: "Phone", category: "Misc", icon: <Phone size={32} /> },
];

interface BuiltInIconsProps {
  onSelect: (svgString: string) => void;
}

export function BuiltInIcons({ onSelect }: BuiltInIconsProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(ICONS.map((i) => i.category))];

  const filteredIcons = ICONS.filter((icon) => {
    const matchesSearch =
      icon.name.toLowerCase().includes(search.toLowerCase()) ||
      icon.id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || icon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (icon: BuiltInIcon) => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${renderIconToSvg(icon.icon)}</svg>`;
    const dataUrl = `data:image/svg+xml,${encodeURIComponent(svgString)}`;
    onSelect(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={12}
          />
          <input
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/40 border border-border rounded-lg py-1.5 pl-8 pr-3 text-xs focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
            !selectedCategory
              ? "bg-primary text-primary-foreground"
              : "bg-muted/40 hover:bg-muted/60"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 hover:bg-muted/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
        {filteredIcons.map((icon) => (
          <button
            key={icon.id}
            onClick={() => handleSelect(icon)}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-primary/30 transition-all"
            title={icon.name}
          >
            <div className="text-foreground/80">{icon.icon}</div>
            <span className="text-[8px] text-muted-foreground mt-1 truncate w-full text-center">
              {icon.name}
            </span>
          </button>
        ))}
      </div>

      {filteredIcons.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No icons found
        </div>
      )}
    </div>
  );
}

function renderIconToSvg(icon: React.ReactNode): string {
  return "";
}
