import { useEffect, useState } from "react";
import {
  IconAlertCircle,
  IconCircle,
  IconCircleCheckFilled,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { Form, NavLink, useNavigation } from "react-router";
import type { LabelColor } from "~/lib/color";
import { useI18n } from "~/lib/i18n/i18n";
import type { AuthActionData } from "~/.server/auth/auth-form";
import styles from "./AuthForm.module.css";

type Flow = "login" | "register";
type Field = keyof AuthActionData["errors"];

const MIN_PASSWORD_LENGTH = 8;

const perks: { key: "save" | "qr" | "stats"; color: LabelColor }[] = [
  { key: "save", color: "tomato" },
  { key: "qr", color: "jade" },
  { key: "stats", color: "cobalt" },
];

export function AuthForm({
  flow,
  actionData,
}: {
  flow: Flow;
  actionData: AuthActionData | undefined;
}) {
  const { t } = useI18n();
  const submitting = useNavigation().state === "submitting";
  const isLogin = flow === "login";

  const [edited, setEdited] = useState<ReadonlySet<Field>>(new Set());

  useEffect(() => setEdited(new Set()), [actionData]);

  const markEdited = (field: Field) =>
    setEdited((prev) => new Set(prev).add(field));

  const serverError = (field: Field) => {
    const key = actionData?.errors[field];
    return key && !edited.has(field) ? t(key) : undefined;
  };

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmBlurred, setConfirmBlurred] = useState(false);
  const mismatch = confirmBlurred && confirm !== "" && confirm !== password;

  const usernameError = serverError("username");
  const passwordError = serverError("password");
  const confirmError =
    serverError("confirmPassword") ??
    (mismatch ? t("errors.passwordMismatch") : undefined);

  return (
    <div className={`page ${styles.wrap}`}>
      <div className={`card ${styles.card}`}>
        <aside className={styles.aside}>
          <h2>{t("auth.asideTitle")}</h2>
          <ul>
            {perks.map(({ key, color }) => (
              <li key={key} data-color={color}>
                <span aria-hidden />
                {t(`auth.perks.${key}`)}
              </li>
            ))}
          </ul>
        </aside>

        <div className={styles.main}>
          <AuthTabs />

          <h1 className={styles.title}>{t(`auth.${flow}.title`)}</h1>
          <p className="muted">{t(`auth.${flow}.subtitle`)}</p>

          <Form method="post" noValidate className={styles.form}>
            {serverError("form") && (
              <div className="alert" role="alert">
                <IconAlertCircle size={18} />
                {serverError("form")}
              </div>
            )}

            <div className="field">
              <label htmlFor="username" className="field-label">
                {t("auth.username")}
              </label>
              <input
                id="username"
                name="username"
                className="input"
                placeholder={t("auth.usernamePlaceholder")}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={50}
                defaultValue={actionData?.username}
                aria-invalid={usernameError ? true : undefined}
                onChange={() => markEdited("username")}
              />
              {usernameError ? (
                <p className="field-error">{usernameError}</p>
              ) : (
                !isLogin && (
                  <p className="field-hint">{t("auth.usernameHint")}</p>
                )
              )}
            </div>

            <div className="field">
              <label htmlFor="password" className="field-label">
                {t("auth.password")}
              </label>
              <PasswordInput
                id="password"
                name="password"
                placeholder={t(
                  isLogin
                    ? "auth.passwordPlaceholder"
                    : "auth.newPasswordPlaceholder",
                )}
                autoComplete={isLogin ? "current-password" : "new-password"}
                invalid={!!passwordError}
                onChange={(value) => {
                  setPassword(value);
                  markEdited("password");
                }}
              />
              {passwordError && <p className="field-error">{passwordError}</p>}
              {!isLogin && !passwordError && (
                <PasswordRule met={password.length >= MIN_PASSWORD_LENGTH} />
              )}
            </div>

            {!isLogin && (
              <div className="field">
                <label htmlFor="confirmPassword" className="field-label">
                  {t("auth.confirmPassword")}
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder={t("auth.confirmPlaceholder")}
                  autoComplete="new-password"
                  invalid={!!confirmError}
                  onChange={(value) => {
                    setConfirm(value);
                    markEdited("confirmPassword");
                  }}
                  onBlur={() => setConfirmBlurred(true)}
                />
                {confirmError && <p className="field-error">{confirmError}</p>}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={submitting}
              style={{ marginTop: 4 }}
            >
              {submitting && <span className="spinner" aria-hidden />}
              {t(`auth.${flow}.submit`)}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  invalid,
  onChange,
  onBlur,
  ...props
}: {
  id: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  invalid: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const label = t(visible ? "auth.hidePassword" : "auth.showPassword");

  return (
    <div className="input-with-action">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className="input"
        maxLength={100}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.currentTarget.value)}
        onBlur={onBlur}
      />
      <button
        type="button"
        className="icon-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        title={label}
      >
        {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
      </button>
    </div>
  );
}

function AuthTabs() {
  const { t, localize } = useI18n();
  const tabs = [
    { to: "/login", label: t("nav.login") },
    { to: "/register", label: t("nav.register") },
  ];

  return (
    <nav className={styles.tabs} aria-label={t("auth.tabs")}>
      {tabs.map(({ to, label }) => (
        <NavLink
          key={to}
          to={localize(to)}
          replace
          preventScrollReset
          className={styles.tab}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function PasswordRule({ met }: { met: boolean }) {
  const { t } = useI18n();
  const Icon = met ? IconCircleCheckFilled : IconCircle;
  return (
    <p
      className="field-hint"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: met ? "var(--success)" : undefined,
      }}
    >
      <Icon size={14} aria-hidden />
      {t("auth.passwordRule")}
    </p>
  );
}
