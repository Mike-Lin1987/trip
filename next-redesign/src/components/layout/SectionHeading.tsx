type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mb-8 max-w-3xl space-y-3">
      <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
        {eyebrow}
      </p>
      <h1 className="font-serif text-[36px] leading-tight text-[#2f2a24] sm:text-[52px]">
        {title}
      </h1>
      {description ? (
        <p className="text-[18px] leading-9 text-[#5f5549]">{description}</p>
      ) : null}
    </div>
  );
}

export function PageIntro(props: SectionHeadingProps) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-8 pt-28 sm:px-8 lg:px-10">
      <SectionHeading eyebrow={props.eyebrow} title={props.title} />
    </section>
  );
}
