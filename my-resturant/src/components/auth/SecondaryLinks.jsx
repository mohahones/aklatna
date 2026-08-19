import { messages, secondaryLinks } from "../../data/loginContent";

export default function SecondaryLinks({ onSoftAction }) {
  return (
    <nav className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3" aria-label={messages.secondaryNav}>
      {secondaryLinks.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 font-body-lg text-body-lg font-semibold text-secondary transition-colors hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            support_agent
          </span>
          {label}
        </a>
      ))}
    </nav>
  );
}
