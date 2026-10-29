import Image from "next/image";
import edgeProLogo from "@/assets/EDGEPRO.png";

export function BrandMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={edgeProLogo}
      alt="EdgePro"
      width={64}
      height={64}
      className={className}
      priority={priority}
    />
  );
}
