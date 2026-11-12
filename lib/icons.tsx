import {
  Armchair,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Compass,
  Cpu,
  Dna,
  Flame,
  FlaskConical,
  Gavel,
  Globe,
  GraduationCap,
  Heart,
  HeartHandshake,
  HelpCircle,
  Landmark,
  LayoutGrid,
  Leaf,
  Lightbulb,
  Megaphone,
  Microscope,
  Palette,
  Puzzle,
  Ribbon,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Users,
  Zap,
} from "lucide-react";

export function OrganizationIcon({
  iconName,
  className = "h-5 w-5",
  "aria-hidden": ariaHidden = true,
}: {
  iconName?: string | null;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  switch ((iconName ?? "").trim()) {
    case "Armchair":
      return <Armchair className={className} aria-hidden={ariaHidden} />;
    case "Award":
      return <Award className={className} aria-hidden={ariaHidden} />;
    case "BookOpen":
      return <BookOpen className={className} aria-hidden={ariaHidden} />;
    case "Brain":
      return <Brain className={className} aria-hidden={ariaHidden} />;
    case "Briefcase":
      return <Briefcase className={className} aria-hidden={ariaHidden} />;
    case "Building2":
      return <Building2 className={className} aria-hidden={ariaHidden} />;
    case "Compass":
      return <Compass className={className} aria-hidden={ariaHidden} />;
    case "Cpu":
      return <Cpu className={className} aria-hidden={ariaHidden} />;
    case "Dna":
      return <Dna className={className} aria-hidden={ariaHidden} />;
    case "Flame":
      return <Flame className={className} aria-hidden={ariaHidden} />;
    case "FlaskConical":
      return <FlaskConical className={className} aria-hidden={ariaHidden} />;
    case "Gavel":
      return <Gavel className={className} aria-hidden={ariaHidden} />;
    case "Globe":
      return <Globe className={className} aria-hidden={ariaHidden} />;
    case "GraduationCap":
      return <GraduationCap className={className} aria-hidden={ariaHidden} />;
    case "Heart":
      return <Heart className={className} aria-hidden={ariaHidden} />;
    case "HeartHandshake":
      return <HeartHandshake className={className} aria-hidden={ariaHidden} />;
    case "HelpCircle":
      return <HelpCircle className={className} aria-hidden={ariaHidden} />;
    case "Landmark":
      return <Landmark className={className} aria-hidden={ariaHidden} />;
    case "LayoutGrid":
      return <LayoutGrid className={className} aria-hidden={ariaHidden} />;
    case "Leaf":
      return <Leaf className={className} aria-hidden={ariaHidden} />;
    case "Lightbulb":
      return <Lightbulb className={className} aria-hidden={ariaHidden} />;
    case "Megaphone":
      return <Megaphone className={className} aria-hidden={ariaHidden} />;
    case "Microscope":
      return <Microscope className={className} aria-hidden={ariaHidden} />;
    case "Palette":
      return <Palette className={className} aria-hidden={ariaHidden} />;
    case "Puzzle":
      return <Puzzle className={className} aria-hidden={ariaHidden} />;
    case "Ribbon":
      return <Ribbon className={className} aria-hidden={ariaHidden} />;
    case "Rocket":
      return <Rocket className={className} aria-hidden={ariaHidden} />;
    case "Scale":
      return <Scale className={className} aria-hidden={ariaHidden} />;
    case "Search":
      return <Search className={className} aria-hidden={ariaHidden} />;
    case "ShieldCheck":
      return <ShieldCheck className={className} aria-hidden={ariaHidden} />;
    case "Stethoscope":
      return <Stethoscope className={className} aria-hidden={ariaHidden} />;
    case "Target":
      return <Target className={className} aria-hidden={ariaHidden} />;
    case "Users":
      return <Users className={className} aria-hidden={ariaHidden} />;
    case "Zap":
      return <Zap className={className} aria-hidden={ariaHidden} />;
    case "Sparkles":
    default:
      return <Sparkles className={className} aria-hidden={ariaHidden} />;
  }
}
