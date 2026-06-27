import { messages, secondaryLinks } from "../../data/loginContent";

export default function SecondaryLinks({ onSoftAction }) {
  return (
    <nav className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3" aria-label={messages.secondaryNav}>
      {secondaryLinks.map((link) => (
        <button
          key={link}
          type="button"
          onClick={() => onSoftAction(`${messages.selectedPrefix} ${link}`)}
          className="font-label-sm text-label-sm text-secondary transition-colors hover:text-on-surface"
        >
          {link}
        </button>
      ))}
    </nav>
  );
}
