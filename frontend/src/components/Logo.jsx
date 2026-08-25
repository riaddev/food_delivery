import orangeLogo from "../assets/logo/logo-orange.png";
import whiteLogo from "../assets/logo/logo-white.png";
import darkLogo from "../assets/logo/logo-dark.png";

const MARK_SRC = {
  color: orangeLogo,
  white: whiteLogo,
  dark: darkLogo,
};

const LogoMark = ({ size = 36, variant = "color", className = "" }) => (
  <img
    src={MARK_SRC[variant] || MARK_SRC.color}
    alt="Swift Bite logo"
    width={size}
    height={size}
    className={`shrink-0 select-none ${className}`}
  />
);

const Logo = ({
  size = 36,
  iconOnly = false,
  variant = "color",
  textClassName = "text-[19px] font-extrabold tracking-tight",
  swiftClassName = "text-gray-900",
  biteClassName = "text-[#FF6B00]",
  className = "",
}) => (
  <span className={`inline-flex items-center gap-3 ${className}`}>
    <LogoMark size={size} variant={variant} />
    {!iconOnly && (
      <span className={`${textClassName} leading-none`}>
        <span className={swiftClassName}>Swift</span>
        <span className={`${biteClassName} ml-[0.16em]`}>Bite</span>
      </span>
    )}
  </span>
);

export default Logo;