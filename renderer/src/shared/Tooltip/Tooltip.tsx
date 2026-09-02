import { useState, ReactNode } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";
import "./Tooltip.css";

interface Props {
  children: ReactNode;
  tooltipText?: string;
  isClickable?: boolean;
  disabled?: boolean;
}

const Tooltip = ({ children, tooltipText = "Copied", isClickable = false, disabled = false }: Props) => {
  const [isTransparent, setIsTransparent] = useState(true);
  const [isRemoved, setIsRemoved] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    setIsTransparent(false);
    setIsRemoved(false);

    setTimeout(() => {
      setIsTransparent(true);

      setTimeout(() => setIsRemoved(true), 150);
    }, 750);
  };
  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const renderClickableTooltip = () => (
    <div className="tooltip-wrapper" data-testid="clickable-tooltip-test-id" onClick={handleClick}>
      {children}
      <p
        className={`tooltip 
        ${isTransparent ? "opacity-0" : "opacity-90"} 
        ${isRemoved ? "invisible" : "visible"}`}
      >
        <CheckIcon className="w-4 h-4" />
        {tooltipText}
      </p>
    </div>
  );

  const renderHoverTooltip = () => (
    <div
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid="hover-tooltip-test-id"
    >
      {children}
      {showTooltip && !disabled && <p className="tooltip visible opacity-90">{tooltipText}</p>}
    </div>
  );

  return isClickable ? renderClickableTooltip() : renderHoverTooltip();
};

export default Tooltip;
