export function BrandMark({ className = "w-32" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Salon Central"
      className={`block aspect-[922/448] bg-brand ${className}`}
      style={{
        WebkitMaskImage: "url(/logo-mark.png)",
        maskImage: "url(/logo-mark.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
