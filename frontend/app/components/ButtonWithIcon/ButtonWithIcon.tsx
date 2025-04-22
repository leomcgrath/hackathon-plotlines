
type Props = {
  text: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  iconPlacement?: "left" | "right";
}

export function ButtonWithIcon({ text, onClick, icon, iconPlacement = "left" }: Props) {
  return (
    <button
      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-3 rounded inline-flex items-center cursor-pointer gap-2"
      onClick={onClick}
    >
      {iconPlacement === "left" && icon}
      <span>{text}</span>
      {iconPlacement === "right" && icon}
    </button>
  )
}
