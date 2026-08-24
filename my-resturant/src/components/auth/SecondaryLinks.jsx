import { messages, secondaryLinks } from "../../data/loginContent";
import { getSupportHref } from "../../utils/supportLink";

export default function SecondaryLinks() {
  return (
    <nav className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3" aria-label={messages.secondaryNav}>
        {secondaryLinks.map((link) => (
          <a
            key={link.label}
            href={getSupportHref(link)}
            target={getSupportHref(link)?.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="inline-flex items-center gap-2 font-body-lg text-body-lg font-semibold text-secondary transition-colors hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            support_agent
          </span>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
