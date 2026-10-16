// Shared heading for each part of the career section: a bold Geist title with its one-line
// description directly underneath, so the header always sits tight against what it introduces.
export default function PartHeading({ title, description, className = "", size = "lg" }: {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  /** "sm"/"xs" when the heading sits above bigger content titles, e.g. the pinned job title */
  size?: "lg" | "sm" | "xs";
}) {
  return (
    <div className={className}>
      <h3 className={`font-bold leading-[1.05] tracking-tight text-balance ${
        size === "lg" ? "text-4xl md:text-5xl" : size === "sm" ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
      }`}>
        {title}
      </h3>
      {description && (
        <p className={size === "xs"
          ? "mt-2 text-[13px] leading-snug text-foreground/55"
          : "mt-3 text-sm md:text-[15px] leading-relaxed text-foreground/60 max-w-[46ch]"}>{description}</p>
      )}
    </div>
  );
}
