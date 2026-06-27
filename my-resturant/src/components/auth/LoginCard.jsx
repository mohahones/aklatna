import { loginCopy } from "../../data/loginContent";
import { Link } from "react-router-dom";
import LoginForm from "./LoginForm";

export default function LoginCard(props) {
  return (
    <section className="login-card-shadow rounded-xl border border-border-subtle bg-surface-container-lowest p-8 md:p-10">
      <div className="mb-8 text-right">
        <h2 className="font-headline-md text-headline-md text-on-surface">{loginCopy.title}</h2>
        <p className="mt-1 font-body-md text-body-md text-secondary">{loginCopy.description}</p>
      </div>

      <LoginForm {...props} />

      <div className="mt-10 text-center">
        <p className="font-body-md text-body-md text-secondary">
          {loginCopy.newUser}{" "}
          <Link to="/signup" className="font-bold text-primary transition-all hover:underline">
            {loginCopy.createAccount}
          </Link>
        </p>
      </div>
    </section>
  );
}
